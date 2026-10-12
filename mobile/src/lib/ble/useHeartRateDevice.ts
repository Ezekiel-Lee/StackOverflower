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
  const connectingRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);

  const connectToDevice = useCallback(
    async (device: Device, backendDeviceId: string) => {
      if (connectingRef.current || cleanupRef.current) {
        return;
      }

      connectingRef.current = true;
      intentionalDisconnectRef.current = false;
      setStatus("connecting");

      let sessionId: string | null = null;

      try {
        const granted = await requestBlePermissions();

        if (!granted) {
          throw new Error("Bluetooth permission was not granted");
        }

        backendDeviceIdRef.current = backendDeviceId;

        sessionId = await startDeviceSession(backendDeviceId);
        sessionIdRef.current = sessionId;

        const cleanup = await connectAndMonitorHeartRate(
          device,
          async (bpm, timestamp) => {
            try {
              await sendHeartRateReading(backendDeviceId, bpm, timestamp);
            } catch (error) {
              console.warn("Failed to send heart-rate reading:", error);
            }
          },
          async (reason) => {
            // Ignore duplicate or intentional disconnect callbacks.
            if (intentionalDisconnectRef.current) {
              return;
            }

            intentionalDisconnectRef.current = true;

            const currentSessionId = sessionIdRef.current;
            sessionIdRef.current = null;
            cleanupRef.current = null;
            backendDeviceIdRef.current = null;

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

        if (sessionId) {
          try {
            await endDeviceSession(
              backendDeviceId,
              sessionId,
              "connection_failed",
            );
          } catch (sessionError) {
            console.warn(
              "Failed to close session after connection failure:",
              sessionError,
            );
          }
        }

        sessionIdRef.current = null;
        cleanupRef.current = null;
        backendDeviceIdRef.current = null;

        setStatus("failed");
        throw error;
      } finally {
        connectingRef.current = false;
      }
    },
    [],
  );

  const disconnect = useCallback(async () => {
    intentionalDisconnectRef.current = true;

    getBleManager().stopDeviceScan();

    const cleanup = cleanupRef.current;
    cleanupRef.current = null;

    const currentSessionId = sessionIdRef.current;
    const backendDeviceId = backendDeviceIdRef.current;

    sessionIdRef.current = null;
    backendDeviceIdRef.current = null;

    try {
      cleanup?.();
    } catch (error) {
      console.warn("Failed to clean up BLE connection:", error);
    }

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
