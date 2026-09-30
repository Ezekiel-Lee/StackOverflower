import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { syncHealthDataToBackend } from "./syncHealthData";
import { getConnectedDeviceId } from "@/store/deviceStore";

const SYNC_TASK_NAME = "health-connect-sync";

// Called once, when the app starts up (see src/app/_layout.tsx).
export function defineHealthSyncTask() {
  TaskManager.defineTask(SYNC_TASK_NAME, async () => {
    const deviceId = getConnectedDeviceId();
    if (!deviceId) return BackgroundTask.BackgroundTaskResult.Failed;

    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      await syncHealthDataToBackend(deviceId, fifteenMinutesAgo);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (e) {
      console.warn("Background sync failed:", e);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerHealthSync() {
  await BackgroundTask.registerTaskAsync(SYNC_TASK_NAME, {
    minimumInterval: 15,
  });
}
