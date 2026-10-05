import type { Ionicons } from "@expo/vector-icons";

export type SensorStyle = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  card: string;
  iconColor: string;
};

const heartRateStyle: SensorStyle = {
  name: "Heart Rate",
  icon: "heart-outline",
  card: "bg-red-50",
  iconColor: "#ef4444",
};

const bloodOxygenStyle: SensorStyle = {
  name: "Blood Oxygen",
  icon: "water-outline",
  card: "bg-blue-50",
  iconColor: "#3b82f6",
};

const stepCountStyle: SensorStyle = {
  name: "Steps",
  icon: "footsteps-outline",
  card: "bg-yellow-50",
  iconColor: "#eab308",
};

const activeEnergyStyle: SensorStyle = {
  name: "Active Energy",
  icon: "flame-outline",
  card: "bg-orange-50",
  iconColor: "#f97316",
};

const sleepStyle: SensorStyle = {
  name: "Sleep",
  icon: "moon-outline",
  card: "bg-green-50",
  iconColor: "#22c55e",
};

export const sensorStyles: Record<string, SensorStyle> = {
  heart_rate: heartRateStyle,
  heartRate: heartRateStyle,
  blood_oxygen: bloodOxygenStyle,
  bloodOxygen: bloodOxygenStyle,
  steps: stepCountStyle,
  stepCount: stepCountStyle,
  active_energy: activeEnergyStyle,
  activeEnergy: activeEnergyStyle,
  sleep: sleepStyle,
};

export const fallbackSensorStyle: SensorStyle = {
  name: "Unknown Sensor",
  icon: "analytics-outline",
  card: "bg-gray-50",
  iconColor: "#6b7280",
};

export function formatSensorName(sensorType: string): string {
  return sensorType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getSensorStyle(sensorType: string): SensorStyle {
  const style = sensorStyles[sensorType];

  if (style) {
    return style;
  }

  return {
    ...fallbackSensorStyle,
    name: formatSensorName(sensorType),
  };
}
