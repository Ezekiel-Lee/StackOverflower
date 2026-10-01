import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { getSensorStyle } from "@/lib/sensorStyles";
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
  const style = getSensorStyle(sensorType);

  return (
    <View className={`w-[48%] rounded-2xl px-4 py-4 ${style.card}`}>
      <View className="flex-row items-start justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name={style.icon} size={25} color={style.iconColor} />
        </View>

        <TouchableOpacity onPress={onRemove}>
          <Ionicons name="close" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <Text className="mt-4 font-coiny text-sm text-gray-600">
        {style.name}
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
