import type { SensorData } from "@/types/sensor";

export const STRESS = "stress";

export const CANONICAL_DISPLAY_SENSORS = [
  "heartRate",
  "stepCount",
  "bloodOxygen",
  "activeEnergy",
  "sleep",
] as const;

export type CanonicalDisplaySensor =
  (typeof CANONICAL_DISPLAY_SENSORS)[number];

export function formatSensorName(sensorType: string): string {
  return sensorType
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatSleepDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function formatSensorDisplay(
  sensorType: string,
  value: number,
  unit?: string | null,
): string {
  switch (sensorType) {
    case "sleep":
      return formatSleepDuration(value);
    case "bloodOxygen":
      return `${Math.round(value)}%`;
    case "heartRate":
      return `${Math.round(value)} bpm`;
    case "stepCount":
      return `${Math.round(value)} steps`;
    case "activeEnergy":
      return `${Math.round(value)} kcal`;
    default:
      return unit ? `${value} ${unit}` : String(value);
  }
}

export function getAvailableSensors(sensorData: SensorData[]): string[] {
  return Array.from(
    new Set(
      sensorData
        .map((sensor) => sensor.sensor_type)
        .filter((sensorType) => sensorType !== STRESS),
    ),
  );
}

export function getPickerSensors(
  sensorData: SensorData[],
  supportedSensors: string[] | null | undefined,
): string[] {
  if (supportedSensors == null) {
    return getAvailableSensors(sensorData);
  }

  return supportedSensors.filter((sensorType) => sensorType !== STRESS);
}

export function getVisibleSensorTypes(
  sensorData: SensorData[],
  supportedSensors: string[] | null | undefined,
): string[] {
  if (supportedSensors == null) {
    const available = new Set(getAvailableSensors(sensorData));
    return CANONICAL_DISPLAY_SENSORS.filter((sensorType) =>
      available.has(sensorType),
    );
  }

  return CANONICAL_DISPLAY_SENSORS.filter((sensorType) =>
    supportedSensors.includes(sensorType),
  );
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
