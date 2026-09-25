import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { formatSensorName } from "@/lib/sensorUtils";

type Props = {
  sensorType: string;
  readingCount: number;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function SensorOption({
  sensorType,
  readingCount,
  selected,
  disabled,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`mb-3 flex-row items-center rounded-2xl border px-4 py-4 ${
        selected ? "border-green-700 bg-green-50" : "border-gray-200 bg-white"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
        <Ionicons name="analytics-outline" size={25} color="#166534" />
      </View>

      <View className="ml-4 flex-1">
        <Text className="font-coiny text-lg text-dark-green">
          {formatSensorName(sensorType)}
        </Text>

        <Text className="mt-1 text-xs text-gray-500">
          {readingCount} readings
        </Text>
      </View>

      {selected && (
        <Ionicons name="checkmark-circle" size={25} color="#166534" />
      )}
    </Pressable>
  );
}
