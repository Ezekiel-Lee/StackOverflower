import { BleManager, Device, Subscription } from "react-native-ble-plx";
import { Buffer } from "buffer";

const HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
const HEART_RATE_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb";

export const bleManager = new BleManager();

// Scans for any nearby device advertising the standard Heart Rate Service.
// Calls onDeviceFound once per device; call bleManager.stopDeviceScan() when done.
export function scanForHeartRateDevices(onDeviceFound: (device: Device) => void) {
  bleManager.startDeviceScan([HEART_RATE_SERVICE_UUID], null, (error, device) => {
    if (error) {
      console.warn("BLE scan error:", error);
      return;
    }
    if (device) {
      onDeviceFound(device);
    }
  });
}

// Parses the raw bytes per the official Heart Rate Measurement spec.
function parseHeartRate(base64Value: string): number {
  const bytes = Buffer.from(base64Value, "base64");
  const flags = bytes[0];
  const isUint16 = (flags & 0x01) === 1;
  return isUint16 ? bytes.readUInt16LE(1) : bytes.readUInt8(1);
}

// Connects to a specific device and starts listening for live heart rate
// values. onReading fires every time a new value arrives. Returns a
// cleanup function -- call it to disconnect and stop listening.
export async function connectAndMonitorHeartRate(
  device: Device,
  onReading: (bpm: number, timestamp: Date) => void,
  onDisconnect: (reason: string) => void,
): Promise<() => void> {
  const connected = await device.connect();
  await connected.discoverAllServicesAndCharacteristics();

  const subscription: Subscription = connected.monitorCharacteristicForService(
    HEART_RATE_SERVICE_UUID,
    HEART_RATE_MEASUREMENT_UUID,
    (error, characteristic) => {
      if (error) {
        onDisconnect(error.message ?? "unknown_error");
        return;
      }
      if (characteristic?.value) {
        const bpm = parseHeartRate(characteristic.value);
        onReading(bpm, new Date());
      }
    },
  );

  const disconnectSub = connected.onDisconnected((error) => {
    onDisconnect(error ? error.message ?? "connection_lost" : "user");
  });

  return () => {
    subscription.remove();
    disconnectSub.remove();
    connected.cancelConnection();
  };
}
