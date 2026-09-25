import type { SensorData } from "@/types/sensor";

export function formatSensorName(sensorType: string): string {
  return sensorType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getAvailableSensors(sensorData: SensorData[]): string[] {
  return Array.from(new Set(sensorData.map((sensor) => sensor.sensor_type)));
}

export function getLatestReading(
  sensorData: SensorData[],
  sensorType: string,
): SensorData | null {
  const readings = sensorData
    .filter((sensor) => sensor.sensor_type === sensorType)
    .sort(
      (a, b) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    );

  return readings[0] ?? null;
}

export function getSensorReadings(
  sensorData: SensorData[],
  sensorType: string,
): SensorData[] {
  return sensorData
    .filter((sensor) => sensor.sensor_type === sensorType)
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );
}

export function getSensorAverage(readings: SensorData[]): number | null {
  if (readings.length === 0) {
    return null;
  }

  const total = readings.reduce((sum, reading) => sum + reading.value, 0);

  return Math.round(total / readings.length);
}
