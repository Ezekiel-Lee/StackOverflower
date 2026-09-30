import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import HighlightCard from "./highlightCard";

import type { SensorData } from "@/types/sensor";
import { getLatestReading } from "@/lib/sensorUtils";

type Props = {
  sensorTypes: string[];
  sensorData: SensorData[];
  onAdd: () => void;
  onRemove: (sensorType: string) => void;
};

export default function HighlightsGrid({
  sensorTypes,
  sensorData,
  onAdd,
  onRemove,
}: Props) {
  if (sensorTypes.length === 0) {
    return (
      <View className="mt-4 mx-4 rounded-2xl bg-gray-50 px-4 py-8">
        <View className="items-center">
          <Ionicons name="grid-outline" size={38} color="#166534" />

          <Text className="mt-3 font-coiny text-xl text-dark-green">
            No highlights yet
          </Text>

          <Text className="mt-1 text-center text-sm text-gray-500">
            Add sensor readings you want to see on your dashboard.
          </Text>

          <TouchableOpacity
            onPress={onAdd}
            className="mt-5 flex-row items-center rounded-full bg-dark-green px-5 py-3"
          >
            <Ionicons name="add" size={20} color="white" />

            <Text className="ml-2 font-coiny text-white">Add Highlight</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-4 px-4">
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {sensorTypes.map((sensorType) => {
          const reading = getLatestReading(sensorData, sensorType);

          if (!reading) {
            return null;
          }

          return (
            <HighlightCard
              key={sensorType}
              sensorType={sensorType}
              reading={reading}
              onRemove={() => onRemove(sensorType)}
            />
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onAdd}
        className="mt-5 flex-row items-center self-start rounded-full bg-dark-green px-5 py-3"
      >
        <Ionicons name="add" size={20} color="white" />

        <Text className="ml-2 font-coiny text-white">Add Highlight</Text>
      </TouchableOpacity>
    </View>
  );
}
