import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import type { SensorData } from "@/types/sensor";
import {
  formatSensorName,
  getSensorAverage,
  getSensorReadings,
} from "@/lib/sensorUtils";

type Props = {
  sensorType: string;
  sensorData: SensorData[];
  onChange: () => void;
  onRemove: () => void;
};

export default function SensorGraph({
  sensorType,
  sensorData,
  onChange,
  onRemove,
}: Props) {
  const readings = getSensorReadings(sensorData, sensorType);

  const average = getSensorAverage(readings);

  const graphData = readings.map((reading) => {
    const date = new Date(reading.recorded_at);

    return {
      value: reading.value,
      label: date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });

  const unit = readings[0]?.unit ?? "";

  return (
    <View className="mx-4 mt-4 rounded-2xl bg-green-50 px-3 pb-4 pt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-coiny text-xl text-dark-green">
            {formatSensorName(sensorType)}
          </Text>

          <Text className="mt-1 text-sm text-gray-500">Today</Text>
        </View>

        <View className="items-end">
          <Text className="font-coiny text-2xl text-dark-green">
            {average ?? "--"}
          </Text>

          {unit && (
            <Text className="text-xs text-gray-500">{unit} average</Text>
          )}
        </View>
      </View>

      {graphData.length > 0 ? (
        <LineChart
          data={graphData}
          height={170}
          width={320}
          thickness={3}
          color="#166534"
          curved
          hideRules
          yAxisTextStyle={{
            color: "#6b7280",
            fontSize: 10,
          }}
          xAxisLabelTextStyle={{
            color: "#6b7280",
            fontSize: 9,
          }}
          xAxisColor="#d1d5db"
          yAxisColor="#d1d5db"
          dataPointsColor="#166534"
          dataPointsRadius={4}
          noOfSections={4}
          initialSpacing={10}
          spacing={38}
        />
      ) : (
        <View className="h-[170px] items-center justify-center">
          <Ionicons name="analytics-outline" size={32} color="#9ca3af" />

          <Text className="mt-2 text-sm text-gray-500">
            No readings available.
          </Text>
        </View>
      )}

      <View className="mt-3 flex-row justify-end gap-3">
        <TouchableOpacity
          onPress={onChange}
          className="rounded-full bg-white px-4 py-2"
        >
          <Text className="font-coiny text-dark-green">Change</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRemove}
          className="rounded-full bg-white px-4 py-2"
        >
          <Text className="font-coiny text-red-600">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
