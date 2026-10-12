import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type DashboardState = {
  graphSensors: string[];
  summarySensors: string[];

  addGraphSensor: (sensorType: string) => void;
  changeGraphSensor: (currentSensor: string, nextSensor: string) => void;
  removeGraphSensor: (sensorType: string) => void;

  addSummarySensor: (sensorType: string) => void;
  removeSummarySensor: (sensorType: string) => void;
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      graphSensors: [],
      summarySensors: [],

      addGraphSensor: (sensorType) =>
        set((state) => {
          if (state.graphSensors.includes(sensorType)) {
            return state;
          }

          return {
            graphSensors: [...state.graphSensors, sensorType],
          };
        }),

      changeGraphSensor: (currentSensor, nextSensor) =>
        set((state) => {
          if (
            !state.graphSensors.includes(currentSensor) ||
            (currentSensor !== nextSensor &&
              state.graphSensors.includes(nextSensor))
          ) {
            return state;
          }

          return {
            graphSensors: state.graphSensors.map((sensor) =>
              sensor === currentSensor ? nextSensor : sensor,
            ),
          };
        }),

      removeGraphSensor: (sensorType) =>
        set((state) => ({
          graphSensors: state.graphSensors.filter(
            (sensor) => sensor !== sensorType,
          ),
        })),

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
      version: 1,
      migrate: (persistedState: unknown) => {
        const oldState = persistedState as {
          graphSensor?: string | null;
          graphSensors?: string[];
          summarySensors?: string[];
        };

        return {
          graphSensors:
            oldState.graphSensors ??
            (oldState.graphSensor ? [oldState.graphSensor] : []),
          summarySensors: oldState.summarySensors ?? [],
        };
      },
    },
  ),
);
