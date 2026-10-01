import {
  initialize,
  requestPermission,
  getGrantedPermissions,
} from "react-native-health-connect";

const PERMISSIONS = [
  {
    accessType: "read" as const,
    recordType: "HeartRate" as const,
  },
  {
    accessType: "read" as const,
    recordType: "Steps" as const,
  },
  {
    accessType: "read" as const,
    recordType: "SleepSession" as const,
  },
];

export async function isHealthConnectAvailable(): Promise<boolean> {
  try {
    const initialized = await initialize();

    console.log("[Health Connect] initialized:", initialized);

    return initialized;
  } catch (error) {
    console.warn("[Health Connect] initialization failed:", error);

    return false;
  }
}

export async function ensureHealthConnectPermissions(): Promise<boolean> {
  try {
    // IMPORTANT:
    // initialize() must complete before requestPermission().
    const initialized = await initialize();

    if (!initialized) {
      console.warn("[Health Connect] not available");
      return false;
    }

    const granted = await getGrantedPermissions();

    const alreadyGranted = PERMISSIONS.every((permission) =>
      granted.some(
        (item) =>
          item.recordType === permission.recordType &&
          item.accessType === permission.accessType,
      ),
    );

    if (alreadyGranted) {
      console.log("[Health Connect] all permissions already granted");

      return true;
    }

    console.log("[Health Connect] requesting permissions...");

    const result = await requestPermission(PERMISSIONS);

    console.log("[Health Connect] permission result:", result);

    return PERMISSIONS.every((permission) =>
      result.some(
        (item) =>
          item.recordType === permission.recordType &&
          item.accessType === permission.accessType,
      ),
    );
  } catch (error) {
    console.error("[Health Connect] permission request failed:", error);

    return false;
  }
}
