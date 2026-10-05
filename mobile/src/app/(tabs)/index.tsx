import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useSelectedDevice } from "@/hooks/useSelectedDevice";
import { useSensorData } from "@/hooks/useSensorData";
import { getPickerSensors } from "@/lib/sensorUtils";

import DashboardHeader from "@/components/dashboard/dashboardHeader";
import DashboardSection from "@/components/dashboard/dashboardSection";
import EmptyGraph from "@/components/dashboard/emptyGraph";
import SensorGraph from "@/components/dashboard/sensorGraph";
import HighlightsGrid from "@/components/dashboard/highlightGrid";
import AddSensorModal from "@/components/dashboard/addSensorModal";

import Highlights from "@/assets/icons/highlights.svg";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const graphSensor = useDashboardStore((state) => state.graphSensor);

  const summarySensors = useDashboardStore((state) => state.summarySensors);

  const setGraphSensor = useDashboardStore((state) => state.setGraphSensor);

  const removeGraph = useDashboardStore((state) => state.removeGraph);

  const addSummarySensor = useDashboardStore((state) => state.addSummarySensor);

  const removeSummarySensor = useDashboardStore(
    (state) => state.removeSummarySensor,
  );

  const { selectedDevice, connectedDeviceId, loading: deviceLoading } =
    useSelectedDevice();

  const { sensorData } = useSensorData(connectedDeviceId);

  const [modalType, setModalType] = useState<"graph" | "highlight" | null>(
    null,
  );

  const supportedSensors = selectedDevice?.supported_sensors ?? null;
  const pickerSensors = getPickerSensors(sensorData, supportedSensors);

  const visibleGraph =
    !selectedDevice ||
    graphSensor == null ||
    graphSensor === "stress" ||
    (supportedSensors != null && !supportedSensors.includes(graphSensor))
      ? null
      : graphSensor;

  const visibleHighlights = !selectedDevice
    ? []
    : (supportedSensors == null
        ? summarySensors
        : summarySensors.filter((sensorType) =>
            supportedSensors.includes(sensorType),
          )
      ).filter((sensorType) => sensorType !== "stress");

  function handleGraphSelect(sensorType: string) {
    setGraphSensor(sensorType);
    setModalType(null);
  }

  function handleHighlightSelect(sensorType: string) {
    addSummarySensor(sensorType);
    setModalType(null);
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        <DashboardHeader displayName={user?.displayName} />

        {deviceLoading ? (
          <View className="mx-4 mt-8">
            <ActivityIndicator />
          </View>
        ) : !connectedDeviceId || !selectedDevice ? (
          <View className="mx-4 mt-4 rounded-2xl border-4 border-[#a0a0a0] bg-[#e9e9e9] p-6">
            <View className="items-center">
              <Ionicons name="watch-outline" size={42} color="#000" />

              <Text className="mt-3 text-center font-[Coiny] text-xl text-black">
                No device connected
              </Text>

              <Text className="mt-2 text-center font-[Coiny] text-sm text-[#727272]">
                Connect a wearable to start receiving sensor data.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {visibleGraph ? (
              <SensorGraph
                sensorType={visibleGraph}
                sensorData={sensorData}
                onChange={() => setModalType("graph")}
                onRemove={removeGraph}
              />
            ) : (
              <View className="mx-4 mt-4">
                <EmptyGraph onAdd={() => setModalType("graph")} />
              </View>
            )}

            <DashboardSection
              title="Highlights"
              icon={<Highlights width={24} height={24} />}
            />

            <HighlightsGrid
              sensorTypes={visibleHighlights}
              sensorData={sensorData}
              onAdd={() => setModalType("highlight")}
              onRemove={removeSummarySensor}
            />
          </>
        )}
      </ScrollView>

      <View className="absolute bottom-20 right-4">
        <Ionicons name="notifications-outline" size={32} color="#000" />
      </View>

      <AddSensorModal
        visible={modalType !== null}
        mode={modalType}
        sensors={pickerSensors}
        sensorData={sensorData}
        selectedGraph={graphSensor}
        selectedHighlights={summarySensors}
        onSelectGraph={handleGraphSelect}
        onSelectHighlight={handleHighlightSelect}
        onClose={() => setModalType(null)}
      />
    </SafeAreaView>
  );
}
