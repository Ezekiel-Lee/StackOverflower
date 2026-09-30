import { useState, useCallback, useRef } from "react";
import { Device } from "react-native-ble-plx";
import { requestBlePermissions } from "./permissions";
import { scanForHeartRateDevices, connectAndMonitorHeartRate, bleManager } from "./heartRateScanner";
import { sendHeartRateReading } from "./syncBleHeartRate";
import { startDeviceSession, endDeviceSession } from "./sessionTracking";

export type BleConnectStatus = "idle" | "scanning" | "connecting" | "connected" | "failed";

export function useHeartRateDevice(deviceId: string) {
  const [status, setStatus] = useState<BleConnectStatus>("idle");
  const cleanupRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const connect = useCallback(async () => {
    const granted = await requestBlePermissions();
    if (!granted) {
      setStatus("failed");
      return;
    }

    setStatus("scanning");

    scanForHeartRateDevices(async (device: Device) => {
      bleManager.stopDeviceScan();
      setStatus("connecting");

      try {
        sessionIdRef.current = await startDeviceSession(deviceId);

        const cleanup = await connectAndMonitorHeartRate(
          device,
          (bpm, timestamp) => {
            sendHeartRateReading(deviceId, bpm, timestamp).catch(console.warn);
          },
          async (reason) => {
            if (sessionIdRef.current) {
              await endDeviceSession(deviceId, sessionIdRef.current, reason);
            }
            setStatus("failed");
          },
        );

        cleanupRef.current = cleanup;
        setStatus("connected");
      } catch (e) {
        console.warn("Connect failed:", e);
        setStatus("failed");
      }
    });
  }, [deviceId]);

  const disconnect = useCallback(async () => {
    cleanupRef.current?.();
    if (sessionIdRef.current) {
      await endDeviceSession(deviceId, sessionIdRef.current, "user");
    }
    setStatus("idle");
  }, [deviceId]);

  return { status, connect, disconnect };
}
