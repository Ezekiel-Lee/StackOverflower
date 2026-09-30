import { readHeartRate, readSteps, readSleep } from "./readHealthData";
import { postSensorData } from "@/lib/api";

export async function syncHealthDataToBackend(deviceId: string, since: Date) {
  const heartRateRecords = await readHeartRate(since);
  for (const record of heartRateRecords) {
    for (const sample of record.samples) {
      await postSensorData(deviceId, {
        sensor_type: "heartRate",
        value: sample.beatsPerMinute,
        unit: "bpm",
        recorded_at: sample.time,
      });
    }
  }

  const stepsRecords = await readSteps(since);
  for (const record of stepsRecords) {
    await postSensorData(deviceId, {
      sensor_type: "steps",
      value: record.count,
      unit: "steps",
      recorded_at: record.endTime,
    });
  }

  const sleepRecords = await readSleep(since);
  for (const record of sleepRecords) {
    const minutes =
      (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 60000;
    await postSensorData(deviceId, {
      sensor_type: "sleep",
      value: Math.round(minutes),
      unit: "minutes",
      recorded_at: record.endTime,
    });
  }
}
