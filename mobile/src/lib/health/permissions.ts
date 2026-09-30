import {
  initialize,
  requestPermission,
  getGrantedPermissions,
} from "react-native-health-connect";

const PERMISSIONS = [
  { accessType: "read" as const, recordType: "HeartRate" as const },
  { accessType: "read" as const, recordType: "Steps" as const },
  { accessType: "read" as const, recordType: "SleepSession" as const },
];

// Call this one function -- it handles initializing, checking, and
// (if needed) requesting permission, all in one place.
export async function ensureHealthConnectPermissions(): Promise<boolean> {
  const isInitialized = await initialize();
  if (!isInitialized) {
    console.warn("Health Connect is not installed on this device");
    return false;
  }

  const granted = await getGrantedPermissions();
  const alreadyHasAll = PERMISSIONS.every((p) =>
    granted.some((g) => g.recordType === p.recordType && g.accessType === p.accessType),
  );

  if (alreadyHasAll) return true;

  const result = await requestPermission(PERMISSIONS);
  return result.length === PERMISSIONS.length;
}
