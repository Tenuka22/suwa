import AsyncStorage from "@react-native-async-storage/async-storage";

const SENSOR_DATA_KEY = "stress_sensor_data";

export interface SensorReading {
  sample: number[];
  timestamp: number;
}

export async function insertSensorData(sample: number[]) {
  const currentData = await getSensorData();
  const newData = [...currentData, { sample, timestamp: Date.now() }];
  await AsyncStorage.setItem(
    SENSOR_DATA_KEY,
    JSON.stringify(newData.slice(-360))
  );
}

export async function getSensorData(): Promise<SensorReading[]> {
  const data = await AsyncStorage.getItem(SENSOR_DATA_KEY);
  return data ? JSON.parse(data) : [];
}
