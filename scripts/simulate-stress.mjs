const SERVER = "http://localhost:3000"; // change to your server's URL+port
const EMAIL = "tenukaomaljith2009@gmail.com";
const DEVICE_ID = "suwa_band_01";

// Physiological sample generator — mimics the ESP32 firmware output
// 5 features: [meanRR, sdnn, rmssd, pnn50, hr]

let phase = 0;
let stress = 0.3;

function gauss(mean, std) {
  const u1 = Math.random(), u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
}

function nextStress() {
  phase += 0.02 + Math.random() * 0.03;
  const sine = Math.sin(phase) * 0.15;
  const drift = (Math.random() - 0.5) * 0.04;
  stress = Math.max(0.05, Math.min(0.95, stress + drift));
  return stress;
}

function generateSample() {
  const s = nextStress();
  const hr = Math.round(gauss(65 + s * 50, 5));
  const meanRR = Math.round(60000 / hr);
  const sdnn = Math.round(gauss(30 + s * 80, 8));
  const rmssd = Math.round(gauss(20 + s * 50, 6));
  const pnn50 = Math.round(gauss(Math.max(0, 40 - s * 40), 5));
  return [meanRR, sdnn, rmssd, pnn50, hr];
}

function generateWindow(size = 4) {
  const now = Date.now();
  const samples = [];
  for (let i = 0; i < size; i++) {
    samples.push({ sample: generateSample(), timestamp: now + i * 250 });
  }
  return samples;
}

async function ingest(windowCount) {
  console.log(`[SIM] Attempting window #${windowCount}...`);
  const samples = generateWindow();
  console.log(`[SIM] Sending ${samples.length} samples to ${SERVER}/api/iot/ingest...`);
  const res = await fetch(`${SERVER}/api/iot/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userEmail: EMAIL, deviceId: DEVICE_ID, samples }),
  });
  
  console.log(`[SIM] Received status ${res.status}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[SIM] Ingest failed (${res.status}):`, JSON.stringify(body));
    return false;
  }
  console.log(`[SIM] Window #${windowCount}: ${body.ingested} samples, ${body.windowsCompleted} predictions`);
  return true;
}

async function main() {
  console.log("[SIM] Stress simulation for", EMAIL);
  let count = 0;
  while (true) {
    count++;
    await ingest(count);
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
