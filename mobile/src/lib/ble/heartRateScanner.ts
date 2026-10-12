import { BleManager, Device, Subscription } from "react-native-ble-plx";
import { Buffer } from "buffer";

const HEART_RATE_SERVICE_UUID = "180d";
const HEART_RATE_MEASUREMENT_UUID = "2a37";

let bleManager: BleManager | null = null;

export function getBleManager(): BleManager {
  if (!bleManager) {
    bleManager = new BleManager();
  }

  return bleManager;
}

export function stopBleScan(): void {
  bleManager?.stopDeviceScan();
}

export function scanForHeartRateDevices(
  onDeviceFound: (device: Device) => void,
  onScanError?: (message: string) => void,
): void {
  const manager = getBleManager();
  const discoveredIds = new Set<string>();

  manager.stopDeviceScan();

  // Scan all BLE devices during discovery.
  // Some wearables don't advertise the heart-rate service.
  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.warn("BLE scan error:", error.message);
      onScanError?.(error.message);
      return;
    }

    if (!device || discoveredIds.has(device.id)) {
      return;
    }

    discoveredIds.add(device.id);

    console.log("BLE device found:", {
      id: device.id,
      name: device.name,
      localName: device.localName,
      serviceUUIDs: device.serviceUUIDs,
    });

    onDeviceFound(device);
  });
}

function parseHeartRate(base64Value: string): number {
  const bytes = Buffer.from(base64Value, "base64");

  if (bytes.length < 2) {
    throw new Error("Invalid heart-rate measurement data");
  }

  const flags = bytes[0];
  const isUint16 = (flags & 0x01) !== 0;

  if (isUint16 && bytes.length < 3) {
    throw new Error("Incomplete 16-bit heart-rate measurement");
  }

  return isUint16 ? bytes.readUInt16LE(1) : bytes.readUInt8(1);
}

export async function connectAndMonitorHeartRate(
  device: Device,
  onReading: (bpm: number, timestamp: Date) => void,
  onDisconnect: (reason: string) => void,
): Promise<() => void> {
  const connected = await device.connect();

  try {
    await connected.discoverAllServicesAndCharacteristics();

    const subscription: Subscription =
      connected.monitorCharacteristicForService(
        HEART_RATE_SERVICE_UUID,
        HEART_RATE_MEASUREMENT_UUID,
        (error, characteristic) => {
          if (error) {
            onDisconnect(error.message);
            return;
          }

          if (characteristic?.value) {
            try {
              const bpm = parseHeartRate(characteristic.value);
              onReading(bpm, new Date());
            } catch (parseError) {
              console.warn(
                "Failed to parse heart-rate measurement:",
                parseError,
              );
            }
          }
        },
      );

    const disconnectSub = connected.onDisconnected((error) => {
      onDisconnect(error?.message ?? "connection_lost");
    });

    return () => {
      subscription.remove();
      disconnectSub.remove();

      connected.cancelConnection().catch((error) => {
        console.warn("Failed to disconnect BLE device:", error);
      });
    };
  } catch (error) {
    await connected.cancelConnection().catch(() => {});

    throw error;
  }
}
