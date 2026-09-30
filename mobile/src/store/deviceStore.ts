import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Tracks the currently-connected wearable's backend device id, shared
// between the Connect screen (which sets it once a device is registered
// and synced) and the Dashboard/background-sync code (which reads it).
// Persisted so the connection survives an app restart.
type DeviceState = {
  connectedDeviceId: string | null;
  setConnectedDeviceId: (deviceId: string | null) => void;
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      connectedDeviceId: null,
      setConnectedDeviceId: (deviceId) => set({ connectedDeviceId: deviceId }),
    }),
    {
      name: "device-config",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Non-hook accessor for use outside React components (e.g. the background
// sync task in src/lib/health/backgroundSync.ts, which can't call hooks).
export function getConnectedDeviceId(): string | null {
  return useDeviceStore.getState().connectedDeviceId;
}
