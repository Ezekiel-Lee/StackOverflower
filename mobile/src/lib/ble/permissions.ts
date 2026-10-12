import { PermissionsAndroid, Platform } from "react-native";

export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    // iOS manages Bluetooth permission prompts through the native API.
    return true;
  }

  try {
    if (Number(Platform.Version) >= 31) {
      // Android 12+: Nearby devices permissions.
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      return (
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }

    // Android 11 and below: location permission for BLE scanning.
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error("Failed to request Bluetooth permissions:", error);
    return false;
  }
}
