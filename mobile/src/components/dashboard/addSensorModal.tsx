import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

import SensorOption from "./sensorOption";

import type { SensorData } from "@/types/sensor";

type Props = {
  visible: boolean;
  mode: "graph" | "highlight" | null;
  sensors: string[];
  sensorData: SensorData[];
  selectedGraph: string | null;
  selectedHighlights: string[];
  onSelectGraph: (sensorType: string) => void;
  onSelectHighlight: (sensorType: string) => void;
  onClose: () => void;
};

export default function AddSensorModal({
  visible,
  mode,
  sensors,
  sensorData,
  selectedGraph,
  selectedHighlights,
  onSelectGraph,
  onSelectHighlight,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[75%] rounded-t-3xl bg-white px-5 pb-10 pt-5">
          {/* Header */}

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-coiny text-2xl text-dark-green">
                {mode === "graph" ? "Add Graph" : "Add Highlight"}
              </Text>

              <Text className="mt-1 text-sm text-gray-500">
                Choose an available sensor
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Sensors */}

          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            {sensors.length === 0 ? (
              <View className="items-center py-10">
                <Ionicons
                  name="hardware-chip-outline"
                  size={40}
                  color="#9ca3af"
                />

                <Text className="mt-3 font-coiny text-lg text-gray-600">
                  No sensor data available
                </Text>

                <Text className="mt-1 text-center text-sm text-gray-400">
                  Connect a device and start receiving sensor data.
                </Text>
              </View>
            ) : (
              sensors.map((sensorType) => {
                const selected =
                  mode === "graph"
                    ? selectedGraph === sensorType
                    : selectedHighlights.includes(sensorType);

                const readingCount = sensorData.filter(
                  (sensor) => sensor.sensor_type === sensorType,
                ).length;

                return (
                  <SensorOption
                    key={sensorType}
                    sensorType={sensorType}
                    readingCount={readingCount}
                    selected={selected}
                    disabled={mode === "highlight" && selected}
                    onPress={() => {
                      if (mode === "graph") {
                        onSelectGraph(sensorType);
                      } else {
                        onSelectHighlight(sensorType);
                      }
                    }}
                  />
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
