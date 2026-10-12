import { ActivityIndicator, ScrollView, Text, View } from "react-native";
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

type ModalType = "graph" | "highlight" | null;
type GraphAction = "add" | "change";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const graphSensors = useDashboardStore((state) => state.graphSensors);
  const summarySensors = useDashboardStore((state) => state.summarySensors);
  const addGraphSensor = useDashboardStore((state) => state.addGraphSensor);
  const changeGraphSensor = useDashboardStore(
    (state) => state.changeGraphSensor,
  );
  const removeGraphSensor = useDashboardStore(
    (state) => state.removeGraphSensor,
  );
  const addSummarySensor = useDashboardStore((state) => state.addSummarySensor);
  const removeSummarySensor = useDashboardStore(
    (state) => state.removeSummarySensor,
  );

  const {
    selectedDevice,
    connectedDeviceId,
    loading: deviceLoading,
  } = useSelectedDevice();

  const { sensorData } = useSensorData(connectedDeviceId);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [graphAction, setGraphAction] = useState<GraphAction>("add");
  const [editingGraph, setEditingGraph] = useState<string | null>(null);

  const supportedSensors = selectedDevice?.supported_sensors ?? null;
  const pickerSensors = getPickerSensors(sensorData, supportedSensors);

  const visibleGraphs = !selectedDevice
    ? []
    : graphSensors.filter(
        (sensorType) =>
          sensorType !== "stress" &&
          (supportedSensors == null || supportedSensors.includes(sensorType)),
      );

  const visibleHighlights = !selectedDevice
    ? []
    : (supportedSensors == null
        ? summarySensors
        : summarySensors.filter((sensorType) =>
            supportedSensors.includes(sensorType),
          )
      ).filter((sensorType) => sensorType !== "stress");

  function openAddGraph() {
    setGraphAction("add");
    setEditingGraph(null);
    setModalType("graph");
  }

  function openChangeGraph(sensorType: string) {
    setGraphAction("change");
    setEditingGraph(sensorType);
    setModalType("graph");
  }

  function handleGraphSelect(sensorType: string) {
    if (graphAction === "change" && editingGraph !== null) {
      changeGraphSensor(editingGraph, sensorType);
    } else {
      addGraphSensor(sensorType);
    }

    setModalType(null);
    setEditingGraph(null);
  }

  function handleHighlightSelect(sensorType: string) {
    addSummarySensor(sensorType);
    setModalType(null);
  }

  function closeModal() {
    setModalType(null);
    setEditingGraph(null);
  }

  return (
    <View className="flex-1 mt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 24 }}
      >
        <DashboardHeader displayName={user?.displayName} />
        {deviceLoading ? (
          <View className="mx-4 mt-8">
            <ActivityIndicator testID="dashboard-loading" />
          </View>
        ) : !connectedDeviceId || !selectedDevice ? (
          <View className="mx-4 mt-4 rounded-2xl border-4 border-[#a0a0a0] bg-[#e9e9e9] p-6">
            <View className="items-center">
              <Ionicons name="watch-outline" size={42} color="#000" />
              <Text className="mt-3 text-center font-coiny text-xl text-black">
                No device connected
              </Text>
              <Text className="mt-2 text-center font-coiny text-sm text-[#727272]">
                Connect a wearable to start receiving sensor data.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {visibleGraphs.length > 0 ? (
              visibleGraphs.map((sensorType) => (
                <SensorGraph
                  key={sensorType}
                  sensorType={sensorType}
                  sensorData={sensorData}
                  onAdd={openAddGraph}
                  onChange={() => openChangeGraph(sensorType)}
                  onRemove={() => removeGraphSensor(sensorType)}
                />
              ))
            ) : (
              <View className="mx-4 mt-4">
                <EmptyGraph onAdd={openAddGraph} />
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

      <AddSensorModal
        visible={modalType !== null}
        mode={modalType}
        graphAction={graphAction}
        sensors={pickerSensors}
        sensorData={sensorData}
        selectedGraphs={graphSensors}
        selectedHighlights={summarySensors}
        editingGraph={editingGraph}
        onSelectGraph={handleGraphSelect}
        onSelectHighlight={handleHighlightSelect}
        onClose={closeModal}
      />
    </View>
  );
}
