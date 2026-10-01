import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DeviceConnectionType = "health-connect" | "ble";

type DeviceState = {
  connectedDeviceId: string | null;

  connectedDeviceType: DeviceConnectionType | null;

  setConnectedDeviceId: (deviceId: string | null) => void;

  setConnectedDeviceType: (type: DeviceConnectionType | null) => void;

  clearConnectedDevice: () => void;
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      connectedDeviceId: null,

      connectedDeviceType: null,

      setConnectedDeviceId: (deviceId) =>
        set({
          connectedDeviceId: deviceId,
        }),

      setConnectedDeviceType: (type) =>
        set({
          connectedDeviceType: type,
        }),

      clearConnectedDevice: () =>
        set({
          connectedDeviceId: null,
          connectedDeviceType: null,
        }),
    }),
    {
      name: "device-config",

      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function getConnectedDeviceId(): string | null {
  return useDeviceStore.getState().connectedDeviceId;
}

export function getConnectedDeviceType(): DeviceConnectionType | null {
  return useDeviceStore.getState().connectedDeviceType;
}
