import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getDevices } from "@/lib/api";
import { useDeviceStore } from "@/store/deviceStore";
import type { Device } from "@/types/device";

export function useSelectedDevice() {
  const connectedDeviceId = useDeviceStore(
    (state) => state.connectedDeviceId ?? null,
  );
  const clearConnectedDevice = useDeviceStore(
    (state) => state.clearConnectedDevice,
  );

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDevices = useCallback(async () => {
    try {
      const data = await getDevices();
      setDevices(data);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDevices();
    }, [loadDevices]),
  );

  const selectedDevice =
    devices.find((device) => device.id === connectedDeviceId) ?? null;

  useEffect(() => {
    if (loading || !connectedDeviceId) {
      return;
    }

    if (devices.length > 0 && !selectedDevice) {
      clearConnectedDevice();
    }
  }, [
    devices,
    loading,
    selectedDevice,
    connectedDeviceId,
    clearConnectedDevice,
  ]);

  return {
    devices,
    selectedDevice,
    connectedDeviceId,
    loading,
    reloadDevices: loadDevices,
  };
}
