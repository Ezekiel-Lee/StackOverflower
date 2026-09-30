import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { formatSensorName } from "@/lib/sensorUtils";
import type { SensorData } from "@/types/sensor";

type Props = {
  sensorType: string;
  reading: SensorData;
  onRemove: () => void;
};

export default function HighlightCard({
  sensorType,
  reading,
  onRemove,
}: Props) {
  return (
    <View className="w-[48%] rounded-2xl bg-green-50 px-4 py-4">
      <View className="flex-row items-start justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name="analytics-outline" size={25} color="#166534" />
        </View>

        <TouchableOpacity onPress={onRemove}>
          <Ionicons name="close" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <Text className="mt-4 font-coiny text-sm text-gray-600">
        {formatSensorName(sensorType)}
      </Text>

      <View className="mt-1 flex-row items-baseline">
        <Text className="font-coiny text-2xl text-dark-green">
          {reading.value}
        </Text>

        <Text className="ml-1 text-sm text-gray-500">{reading.unit}</Text>
      </View>
    </View>
  );
}
