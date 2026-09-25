import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useSensorData } from "@/hooks/useSensorData";

import { getAvailableSensors } from "@/lib/sensorUtils";

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

  /*
   * Replace this with actual
   * connected device.
   */
  const connectedDevice = "";

  const { sensorData, loading } = useSensorData(connectedDevice || null);

  const [modalType, setModalType] = useState<"graph" | "highlight" | null>(
    null,
  );

  const availableSensors = getAvailableSensors(sensorData);

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
        {/* Header */}

        <DashboardHeader displayName={user?.displayName} />

        {/* Graph */}

        {graphSensor ? (
          <SensorGraph
            sensorType={graphSensor}
            sensorData={sensorData}
            onChange={() => setModalType("graph")}
            onRemove={removeGraph}
          />
        ) : (
          <View className="mx-4 mt-4">
            <EmptyGraph onAdd={() => setModalType("graph")} />
          </View>
        )}

        {/* Highlights */}

        <DashboardSection
          title="Highlights"
          icon={<Highlights width={24} height={24} />}
        />

        <HighlightsGrid
          sensorTypes={summarySensors}
          sensorData={sensorData}
          onAdd={() => setModalType("highlight")}
          onRemove={removeSummarySensor}
        />
      </ScrollView>

      {/* Notifications */}

      <View className="absolute bottom-20 right-4">
        <Ionicons name="notifications-outline" size={32} color="#000" />
      </View>

      {/* Sensor selector */}

      <AddSensorModal
        visible={modalType !== null}
        mode={modalType}
        sensors={availableSensors}
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
