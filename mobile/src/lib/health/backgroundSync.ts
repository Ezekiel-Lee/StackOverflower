import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";

import { syncHealthDataToBackend } from "./syncHealthData";

import {
  getConnectedDeviceId,
  getConnectedDeviceType,
} from "@/store/deviceStore";

const SYNC_TASK_NAME = "health-connect-sync";

export function defineHealthSyncTask() {
  TaskManager.defineTask(SYNC_TASK_NAME, async () => {
    const deviceId = getConnectedDeviceId();

    const deviceType = getConnectedDeviceType();

    /*
     * Nothing connected.
     */
    if (!deviceId) {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    /*
     * BLE devices are handled by the
     * active BLE connection.
     *
     * Do not attempt Health Connect
     * syncing for them.
     */
    if (deviceType !== "health-connect") {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      await syncHealthDataToBackend(deviceId, fifteenMinutesAgo);

      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.warn("Background Health Connect sync failed:", error);

      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerHealthSync() {
  await BackgroundTask.registerTaskAsync(SYNC_TASK_NAME, {
    minimumInterval: 15,
  });
}
