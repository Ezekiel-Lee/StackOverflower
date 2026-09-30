import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type DashboardState = {
  graphSensor: string | null;
  summarySensors: string[];

  setGraphSensor: (sensorType: string) => void;
  removeGraph: () => void;

  addSummarySensor: (sensorType: string) => void;
  removeSummarySensor: (sensorType: string) => void;
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      graphSensor: null,
      summarySensors: [],

      setGraphSensor: (sensorType) =>
        set({
          graphSensor: sensorType,
        }),

      removeGraph: () =>
        set({
          graphSensor: null,
        }),

      addSummarySensor: (sensorType) =>
        set((state) => {
          if (state.summarySensors.includes(sensorType)) {
            return state;
          }

          return {
            summarySensors: [...state.summarySensors, sensorType],
          };
        }),

      removeSummarySensor: (sensorType) =>
        set((state) => ({
          summarySensors: state.summarySensors.filter(
            (sensor) => sensor !== sensorType,
          ),
        })),
    }),
    {
      name: "dashboard-config",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
