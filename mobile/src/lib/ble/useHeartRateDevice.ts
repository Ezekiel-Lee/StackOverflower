import { useCallback, useRef, useState } from "react";
import { Device } from "react-native-ble-plx";

import { requestBlePermissions } from "./permissions";
import { connectAndMonitorHeartRate, getBleManager } from "./heartRateScanner";
import { sendHeartRateReading } from "./syncBleHeartRate";
import { startDeviceSession, endDeviceSession } from "./sessionTracking";

export type BleConnectStatus = "idle" | "connecting" | "connected" | "failed";

export function useHeartRateDevice() {
  const [status, setStatus] = useState<BleConnectStatus>("idle");

  const cleanupRef = useRef<(() => void) | null>(null);

  const sessionIdRef = useRef<string | null>(null);

  const backendDeviceIdRef = useRef<string | null>(null);

  const connectToDevice = useCallback(
    async (device: Device, backendDeviceId: string) => {
      const granted = await requestBlePermissions();

      if (!granted) {
        setStatus("failed");

        throw new Error("Bluetooth permission was not granted");
      }

      setStatus("connecting");

      backendDeviceIdRef.current = backendDeviceId;

      try {
        const sessionId = await startDeviceSession(backendDeviceId);

        sessionIdRef.current = sessionId;

        const cleanup = await connectAndMonitorHeartRate(
          device,
          async (bpm, timestamp) => {
            try {
              await sendHeartRateReading(backendDeviceId, bpm, timestamp);
            } catch (error) {
              console.warn("Failed to send heart rate reading:", error);
            }
          },
          async (reason) => {
            const currentSessionId = sessionIdRef.current;

            sessionIdRef.current = null;
            cleanupRef.current = null;

            if (currentSessionId) {
              try {
                await endDeviceSession(
                  backendDeviceId,
                  currentSessionId,
                  reason,
                );
              } catch (error) {
                console.warn("Failed to end BLE session:", error);
              }
            }

            setStatus("failed");
          },
        );

        cleanupRef.current = cleanup;
        setStatus("connected");
      } catch (error) {
        console.warn("BLE connection failed:", error);

        sessionIdRef.current = null;
        cleanupRef.current = null;
        backendDeviceIdRef.current = null;

        setStatus("failed");

        throw error;
      }
    },
    [],
  );

  const disconnect = useCallback(async () => {
    getBleManager().stopDeviceScan();

    cleanupRef.current?.();
    cleanupRef.current = null;

    const currentSessionId = sessionIdRef.current;

    sessionIdRef.current = null;

    const backendDeviceId = backendDeviceIdRef.current;

    backendDeviceIdRef.current = null;

    if (backendDeviceId && currentSessionId) {
      try {
        await endDeviceSession(backendDeviceId, currentSessionId, "user");
      } catch (error) {
        console.warn("Failed to end BLE session:", error);
      }
    }

    setStatus("idle");
  }, []);

  return {
    status,
    connectToDevice,
    disconnect,
  };
}
