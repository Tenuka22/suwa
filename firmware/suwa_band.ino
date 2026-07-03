/*
 * suwa_band.ino — ESP32 + MAX30102 Wearable Health Monitor
 *
 * Hardware:
 *   - ESP32 (GPIO 21=SDA, GPIO 22=SCL)
 *   - MAX30102 (I2C, VCC=3.3V)
 *
 * What it does:
 *   1. Reads IR PPG from MAX30102 at 100 Hz
 *   2. Detects heartbeats via adaptive-threshold peak detection
 *   3. Accumulates RR intervals and computes 11 HRV features
 *   4. Uploads 5-feature vectors [meanRR,SDNN,RMSSD,pNN50,HR]
 *      to api.suwa.life via POST /api/iot/ingest
 *
 * Required Arduino libraries:
 *   - SparkFun MAX3010x Pulse Oximetry Library
 *   - ArduinoJson (v6+)
 *
 * Before uploading, set your WiFi credentials, auth token,
 * and user email below.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include "MAX30105.h"
#include <ArduinoJson.h>

// ============================================================
//  CONFIGURATION — fill in your values
// ============================================================
const char *WIFI_SSID = "Galaxy";
const char *WIFI_PASS = "Tenuka2009";

// User email for identification
const char *USER_EMAIL = "tenukaomaljith2009@gmail.com";
// Unique device identifier
const char *DEVICE_ID = "suwa_band_01";

// ============================================================
//  MAX30102 sensor
// ============================================================
MAX30105 particleSensor;

// I2C pins — ESP32 default (21/22), ESP32-C3 (2/3)
#if defined(CONFIG_IDF_TARGET_ESP32C3)
const int I2C_SDA = 2;
const int I2C_SCL = 3;
#else
const int I2C_SDA = 21;
const int I2C_SCL = 22;
#endif

// ============================================================
//  Signal processing parameters
// ============================================================
const int SAMPLE_RATE_HZ = 100;
const int SAMPLE_INTERVAL_MS = 1000 / SAMPLE_RATE_HZ; // 10 ms

// Moving-average filter width (must be odd)
const int MA_WINDOW = 5;

// Beat-detection thresholds  (tuned for MAX30102 IR at 100 Hz)
const float DC_ALPHA = 0.975;          // DC-tracking IIR coefficient
const float THRESHOLD_RATIO = 0.6;     // fraction of AC amplitude for trigger
const int REFRACTORY_MS = 250;         // ignore signal after a beat (ms)
const int MIN_RR_MS = 280;             // ~214 BPM upper bound
const int MAX_RR_MS = 2200;            // ~27 BPM lower bound

// HRV analysis window
const int MAX_RR_INTERVALS = 120;      // ~2 min at 60 BPM
const int MIN_RR_INTERVALS = 20;       // minimum samples for valid HRV

// ============================================================
//  Simulation mode
// ============================================================
bool sensorAvailable = false;

// ============================================================
//  PPG state
// ============================================================
static float maBuffer[MA_WINDOW];
static int maIndex = 0;
static float dcLevel = 0.0;
static float acPeak = 100.0;           // initial estimate

static unsigned long lastSampleTime = 0;
static unsigned long lastBeatTime = 0;
static unsigned long refractoryUntil = 0;

static float lastSignalValue = 0.0;
static bool wasAboveThreshold = false;

// RR-interval store (milliseconds)
static unsigned long rrMsBuffer[MAX_RR_INTERVALS];
static int rrCount = 0;

// ============================================================
//  API server
// ============================================================
const char *API_HOST = "api.suwa.life";
const int API_PORT = 443;
const char *API_PATH = "/api/iot/ingest";

const unsigned long FEATURE_INTERVAL_MS = 250; // 4 processed feature samples per second
const int FEATURE_BATCH_SIZE = 4;
unsigned long lastFeatureSampleTime = 0;

struct FeatureSample {
  float meanRR;
  float sdnn;
  float rmssd;
  float pnn50;
  float hr;
  unsigned long timestamp;
};

FeatureSample featureBatch[FEATURE_BATCH_SIZE];
int featureBatchCount = 0;

// ============================================================
//  Filter helpers
// ============================================================
float maFilter(float sample) {
  maBuffer[maIndex] = sample;
  maIndex = (maIndex + 1) % MA_WINDOW;
  float sum = 0;
  for (int i = 0; i < MA_WINDOW; i++) sum += maBuffer[i];
  return sum / MA_WINDOW;
}

// ============================================================
//  Simulation  (synthetic PPG when sensor unavailable)
// ============================================================
static float simPhase = 0.0;
static float simBPM = 72.0;
static float simNoiseLevel = 200.0;

long simulateSample() {
  // Simulate 100 Hz PPG waveform.
  // A heartbeat looks like a sharp rise + slower decay.
  // We model it as asymmetric sine: faster attack, slower release.
  float phase = fmodf(simPhase, 1.0f);

  // Asymmetric pulse: 30 % rise, 70 % fall
  float pulse;
  if (phase < 0.3f) {
    // systolic upslope  (0 → 1)
    pulse = sinf(phase / 0.3f * 3.14159f);
  } else {
    // diastolic downslope + dicrotic notch  (1 → 0)
    float t = (phase - 0.3f) / 0.7f;
    pulse = expf(-t * 3.0f) * cosf(t * 2.0f);
    if (pulse < 0) pulse *= 0.3f;
  }

  // Base IR value ~50000 + pulse amplitude ~15000 + noise
  float noise = (random(-1000, 1000) / 1000.0f) * simNoiseLevel;
  long value = (long)(50000.0f + pulse * 15000.0f + noise);

  // Slowly drift the simulated BPM for realistic HRV
  simBPM += (random(-100, 100) / 1000.0f);
  if (simBPM < 60) simBPM = 60;
  if (simBPM > 90) simBPM = 90;

  // Advance phase: 100 Hz / (BPM / 60) = samples per beat
  float beatsPerSecond = simBPM / 60.0f;
  simPhase += beatsPerSecond / 100.0f;
  if (simPhase >= 2.0f) simPhase -= 2.0f;

  return value;
}

// ============================================================
//  Heartbeat detection  (adaptive-threshold peak)
// ============================================================
bool detectBeat(float filteredIr) {
  // Track DC level (slow IIR)
  if (dcLevel == 0.0) {
    dcLevel = filteredIr;
  }
  dcLevel = DC_ALPHA * dcLevel + (1.0 - DC_ALPHA) * filteredIr;

  // Compute AC amplitude (peak - trough within a sliding window)
  float deviation = filteredIr - dcLevel;
  if (deviation > acPeak * 0.5) {
    acPeak = acPeak * 0.9 + deviation * 0.1;
  } else if (deviation < -acPeak * 0.3) {
    acPeak = acPeak * 0.95 + (-deviation) * 0.05;
  }
  if (acPeak < 20.0) acPeak = 20.0;

  // Threshold: DC + a fraction of AC amplitude
  float threshold = dcLevel + THRESHOLD_RATIO * acPeak;
  unsigned long now = millis();

  bool above = (filteredIr > threshold);
  bool beat = false;

  // Rising-edge crossing → candidate beat
  if (above && !wasAboveThreshold && filteredIr >= lastSignalValue) {
    if (now >= refractoryUntil) {
      beat = true;
    }
  }

  // Update state tracking
  // For true peak detection we also check the falling edge after crossing
  if (above) {
    if (filteredIr > lastSignalValue) {
      // still rising
    }
  }

  wasAboveThreshold = above;
  lastSignalValue = filteredIr;

  if (beat) {
    refractoryUntil = now + REFRACTORY_MS;
  }
  return beat;
}

// ============================================================
//  RR-interval management
// ============================================================
bool recordRR(unsigned long rrMs) {
  if (rrMs < MIN_RR_MS || rrMs > MAX_RR_MS) return false;
  if (rrCount < MAX_RR_INTERVALS) {
    rrMsBuffer[rrCount++] = rrMs;
  } else {
    // Shift window: discard oldest, append newest
    for (int i = 0; i < MAX_RR_INTERVALS - 1; i++) {
      rrMsBuffer[i] = rrMsBuffer[i + 1];
    }
    rrMsBuffer[MAX_RR_INTERVALS - 1] = rrMs;
  }
  return true;
}

float clampFloat(float value, float lo, float hi) {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

// ============================================================
//  HRV computation  (all 11 features)
// ============================================================
void computeHRV(
  float &meanRR, float &medianRR, float &sdnn, float &rmssd,
  float &sdsd, float &sdrrRmssd, float &hr,
  float &pnn25, float &pnn50, float &sd1, float &sd2
) {
  // Defaults
  meanRR = 750; medianRR = 750; sdnn = 50; rmssd = 30;
  sdsd = 30; sdrrRmssd = 1.5; hr = 80;
  pnn25 = 0; pnn50 = 0; sd1 = 20; sd2 = 50;

  if (rrCount < MIN_RR_INTERVALS) return;

  // 1. MEAN_RR
  float sum = 0;
  for (int i = 0; i < rrCount; i++) sum += rrMsBuffer[i];
  meanRR = sum / rrCount;

  // 2. MEDIAN_RR
  unsigned long sortedRR[MAX_RR_INTERVALS];
  for (int i = 0; i < rrCount; i++) sortedRR[i] = rrMsBuffer[i];
  for (int i = 1; i < rrCount; i++) {
    unsigned long key = sortedRR[i];
    int j = i - 1;
    while (j >= 0 && sortedRR[j] > key) {
      sortedRR[j + 1] = sortedRR[j];
      j--;
    }
    sortedRR[j + 1] = key;
  }
  if (rrCount % 2 == 0) {
    medianRR = (sortedRR[(rrCount / 2) - 1] + sortedRR[rrCount / 2]) / 2.0f;
  } else {
    medianRR = sortedRR[rrCount / 2];
  }

  // 3. HR
  hr = 60000.0f / meanRR;

  // 4. SDRR (population std dev)
  float varSum = 0;
  for (int i = 0; i < rrCount; i++) {
    float d = rrMsBuffer[i] - meanRR;
    varSum += d * d;
  }
  sdnn = sqrtf(varSum / rrCount);

  // 5-8. RMSSD, SDSD, pNN50, pNN25 from successive differences
  int nDiff = rrCount - 1;
  if (nDiff < 1) return;

  float *diffs = (float *)malloc(nDiff * sizeof(float));
  if (!diffs) return;

  float sumDiffSq = 0;
  float sumDiff = 0;
  int countNN25 = 0, countNN50 = 0;
  for (int i = 0; i < nDiff; i++) {
    // Cast before subtraction. RR intervals are unsigned, so subtracting first
    // can underflow and create billion-scale RMSSD values.
    diffs[i] = (float)rrMsBuffer[i + 1] - (float)rrMsBuffer[i];
    float d2 = diffs[i] * diffs[i];
    sumDiffSq += d2;
    sumDiff += diffs[i];
    if (fabsf(diffs[i]) > 25) countNN25++;
    if (fabsf(diffs[i]) > 50) countNN50++;
  }

  rmssd = sqrtf(sumDiffSq / nDiff);

  float meanDiff = sumDiff / nDiff;
  float varDiff = 0;
  for (int i = 0; i < nDiff; i++) {
    float d = diffs[i] - meanDiff;
    varDiff += d * d;
  }
  sdsd = sqrtf(varDiff / nDiff);

  free(diffs);

  // 7. SDRR_RMSSD ratio
  sdrrRmssd = (rmssd > 0.001f) ? sdnn / rmssd : 0;

  // 8. pNN25
  pnn25 = (100.0f * countNN25) / nDiff;

  // 9. pNN50
  pnn50 = (100.0f * countNN50) / nDiff;

  // 10. SD1  (short-term Poincaré)
  sd1 = rmssd / sqrtf(2.0f);

  // 11. SD2  (long-term Poincaré)
  float sdnn2 = sdnn * sdnn;
  float sd12  = sd1 * sd1;
  float inner = 2.0f * sdnn2 - sd12;
  sd2 = sqrtf((inner > 0) ? inner : 0);

  // Keep uploaded values in the same ranges used by the server/model pipeline.
  meanRR = clampFloat(meanRR, 300.0f, 1500.0f);
  medianRR = clampFloat(medianRR, 300.0f, 1500.0f);
  sdnn = clampFloat(sdnn, 10.0f, 200.0f);
  rmssd = clampFloat(rmssd, 5.0f, 150.0f);
  sdsd = clampFloat(sdsd, 5.0f, 150.0f);
  sdrrRmssd = clampFloat(sdrrRmssd, 0.5f, 5.0f);
  hr = clampFloat(hr, 30.0f, 180.0f);
  pnn25 = clampFloat(pnn25, 0.0f, 100.0f);
  pnn50 = clampFloat(pnn50, 0.0f, 100.0f);
  sd1 = clampFloat(sd1, 5.0f, 150.0f);
  sd2 = clampFloat(sd2, 5.0f, 200.0f);
}

// ============================================================
//  Upload 5-feature vector to api.suwa.life
// ============================================================
bool uploadFeatureBatch(FeatureSample samplesToUpload[], int sampleCount) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[UPLOAD] WiFi not connected");
    return false;
  }

  if (sampleCount <= 0) {
    return true;
  }

  // Build JSON payload:
  // { "userEmail": "...", "deviceId": "...", "samples": [{ "sample": [...], "timestamp": ... }] }
  StaticJsonDocument<2048> doc;

  doc["userEmail"] = USER_EMAIL;
  doc["deviceId"] = DEVICE_ID;

  JsonArray samples = doc.createNestedArray("samples");
  for (int i = 0; i < sampleCount; i++) {
    JsonObject sampleObj = samples.createNestedObject();
    JsonArray sample = sampleObj.createNestedArray("sample");
    sample.add(samplesToUpload[i].meanRR);  // [0] MEAN_RR
    sample.add(samplesToUpload[i].sdnn);    // [1] SDRR / SDNN
    sample.add(samplesToUpload[i].rmssd);   // [2] RMSSD
    sample.add(samplesToUpload[i].pnn50);   // [3] pNN50
    sample.add(samplesToUpload[i].hr);      // [4] HR
    sampleObj["timestamp"] = samplesToUpload[i].timestamp;
  }

  // Serialize to string
  char payload[2048];
  size_t len = serializeJson(doc, payload, sizeof(payload));
  if (len == 0) {
    Serial.println("[UPLOAD] JSON serialization failed");
    return false;
  }

  Serial.printf("[UPLOAD] Payload (%u bytes, %d samples): %s\n", len, sampleCount, payload);

  // ---- HTTPS POST ----
  WiFiClientSecure client;
  client.setInsecure();  // accepts any certificate (dev); for production install CA

  HTTPClient http;
  http.begin(client, String("https://") + API_HOST + API_PATH);
  http.addHeader("Content-Type", "application/json");

  int statusCode = http.POST((uint8_t *)payload, len);
  Serial.printf("[UPLOAD] HTTP %d\n", statusCode);

  bool ok = (statusCode == 200);
  if (!ok) {
    String response = http.getString();
    Serial.printf("[UPLOAD] Response: %s\n", response.c_str());
  }

  http.end();
  return ok;
}

// ============================================================
//  WiFi connection
// ============================================================
bool connectWiFi() {
  Serial.printf("[WIFI] Connecting to %s ...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WIFI] Connected, IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.println("[WIFI] Failed to connect");
  return false;
}

// ============================================================
//  Sensor initialisation
// ============================================================
bool initSensor() {
  Wire.begin(I2C_SDA, I2C_SCL);
  if (!particleSensor.begin(Wire, 0x57)) {
    Serial.println("[SENSOR] MAX30102 not found on I2C bus");
    return false;
  }
  Serial.println("[SENSOR] MAX30102 detected");

  // Setup sensor for heart-rate mode:
  //   LED power moderate, sample rate 100 Hz, ADC range 4096
  byte ledBrightness = 0x1F;  // ~6.4 mA
  byte sampleAverage = 4;     // average 4 samples → effective 100 Hz
  byte ledMode = 2;           // only Red+IR
  int sampleRate = 400;       // 400 Hz internal → / 4 avg = 100 Hz output
  int pulseWidth = 411;       // 411 µs  (ADC resolution 18 bits)
  int adcRange = 4096;        // 4096 nA

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  particleSensor.enableDIETEMPRDY();

  Serial.println("[SENSOR] MAX30102 configured");
  return true;
}

// ============================================================
//  Setup
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== suwa_band  —  MAX30102 HRV Monitor ===");

  // Initialise sensor (non-blocking — continue even if it fails at boot)
  sensorAvailable = initSensor();
  if (!sensorAvailable) {
    Serial.println("[SETUP] Sensor init failed — entering SIMULATION mode");
    randomSeed(analogRead(0));
  }

  // Connect WiFi
  connectWiFi();

  // Initialise filter buffer
  for (int i = 0; i < MA_WINDOW; i++) maBuffer[i] = 0;

  Serial.println("[SETUP] Ready\n");
}

// ============================================================
//  Main loop
// ============================================================
void loop() {
  unsigned long now = millis();

  // ---- 1. Read sensor at ~100 Hz ----
  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;

    long irValue;
    if (sensorAvailable) {
      particleSensor.check();  // advance FIFO
      irValue = particleSensor.getIR();
      if (irValue < 5000) return;  // finger not on sensor (ambient cutoff)
    } else {
      irValue = simulateSample();
    }

    // Convert to float and filter
    float filtered = maFilter((float)irValue);

    // Beat detection
    if (detectBeat(filtered)) {
      unsigned long rrMs = now - lastBeatTime;
      if (lastBeatTime != 0) {
        bool accepted = recordRR(rrMs);
        if (accepted) {
          Serial.printf("[BEAT] RR=%lu ms  (buffer: %d)\n", rrMs, rrCount);
        } else {
          Serial.printf("[BEAT] Rejected RR=%lu ms (outside %d-%d ms)\n", rrMs, MIN_RR_MS, MAX_RR_MS);
        }
      }
      lastBeatTime = now;
    }
  }

  // ---- 2. Reconnect WiFi if needed ----
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[LOOP] WiFi lost, reconnecting…");
    connectWiFi();
  }

  // ---- 3. Produce 4 processed feature samples/sec and upload in batches ----
  if (now - lastFeatureSampleTime >= FEATURE_INTERVAL_MS) {
    lastFeatureSampleTime = now;

    if (rrCount >= MIN_RR_INTERVALS) {
      float meanRR, medianRR, sdnn, rmssd, sdsd, sdrrRmssd, hr, pnn25, pnn50, sd1, sd2;
      computeHRV(meanRR, medianRR, sdnn, rmssd, sdsd, sdrrRmssd, hr, pnn25, pnn50, sd1, sd2);

      // Debug: log all 11 features
      Serial.println("─── HRV Report ───");
      Serial.printf("  MEAN_RR=%.0f  MEDIAN_RR=%.0f  SDRR=%.1f  RMSSD=%.1f\n",
                    meanRR, medianRR, sdnn, rmssd);
      Serial.printf("  SDSD=%.1f  SDRR_RMSSD=%.2f  HR=%.0f\n",
                    sdsd, sdrrRmssd, hr);
      Serial.printf("  pNN25=%.1f  pNN50=%.1f  SD1=%.1f  SD2=%.1f\n",
                    pnn25, pnn50, sd1, sd2);
      Serial.println("─────────────────");

      featureBatch[featureBatchCount++] = { meanRR, sdnn, rmssd, pnn50, hr, now };

      if (featureBatchCount >= FEATURE_BATCH_SIZE) {
        bool ok = uploadFeatureBatch(featureBatch, featureBatchCount);
        Serial.printf("[UPLOAD] %s\n", ok ? "OK" : "FAILED");
        if (ok) featureBatchCount = 0;
      }
    } else {
      Serial.printf("[LOOP] Not enough RR intervals (%d / %d), skipping upload\n",
                    rrCount, MIN_RR_INTERVALS);
    }
  }

  // ---- 4. Small delay to prevent watchdog starvation ----
  delay(1);
}
