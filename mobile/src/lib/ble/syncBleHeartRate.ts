import { postSensorData } from "@/lib/api";

export async function sendHeartRateReading(deviceId: string, bpm: number, timestamp: Date) {
  await postSensorData(deviceId, {
    sensor_type: "heartRate",
    value: bpm,
    unit: "bpm",
    recorded_at: timestamp.toISOString(),
  });
}
