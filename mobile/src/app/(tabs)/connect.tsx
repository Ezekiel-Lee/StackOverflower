import DeviceCard from "@/components/cards/deviceCard";

import { deleteDevice, getDevices, registerDevice } from "@/lib/api";

import {
  ensureHealthConnectPermissions,
  isHealthConnectAvailable,
} from "@/lib/health/permissions";

import { getHealthConnectSource } from "@/lib/health/deviceSource";

import { syncHealthDataToBackend } from "@/lib/health/syncHealthData";

import { requestBlePermissions } from "@/lib/ble/permissions";

import {
  getBleManager,
  scanForHeartRateDevices,
} from "@/lib/ble/heartRateScanner";

import { useHeartRateDevice } from "@/lib/ble/useHeartRateDevice";

import { useDeviceStore } from "@/store/deviceStore";

import { useCallback, useEffect, useState } from "react";

import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { Device } from "react-native-ble-plx";

import { SafeAreaView } from "react-native-safe-area-context";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type BackendDevice = {
  id: string;
  name: string;
  battery?: number;
};

type ConnectionStatus =
  | "idle"
  | "checking-health-connect"
  | "requesting-permission"
  | "syncing"
  | "scanning"
  | "connecting"
  | "removing"
  | "error";

export default function Connect() {
  const [devices, setDevices] = useState<BackendDevice[]>([]);
  const [bleDevices, setBleDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const connectedDeviceId = useDeviceStore((state) => state.connectedDeviceId);

  const connectedDeviceType = useDeviceStore(
    (state) => state.connectedDeviceType,
  );

  const setConnectedDeviceId = useDeviceStore(
    (state) => state.setConnectedDeviceId,
  );

  const setConnectedDeviceType = useDeviceStore(
    (state) => state.setConnectedDeviceType,
  );

  const clearConnectedDevice = useDeviceStore(
    (state) => state.clearConnectedDevice,
  );

  const { connectToDevice, disconnect: disconnectBleDevice } =
    useHeartRateDevice();

  /*
   * --------------------------------------------------
   * Fetch registered devices
   * --------------------------------------------------
   */

  const fetchDevices = useCallback(async () => {
    try {
      const data = await getDevices();

      setDevices(data);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * --------------------------------------------------
   * Initial load
   * --------------------------------------------------
   */

  useEffect(() => {
    fetchDevices();

    return () => {
      getBleManager().stopDeviceScan();
    };
  }, [fetchDevices]);

  /*
   * --------------------------------------------------
   * Cancel BLE search
   * --------------------------------------------------
   */

  function cancelBleSearch() {
    getBleManager().stopDeviceScan();

    setBleDevices([]);
    setConnectionStatus("idle");
    setErrorMessage(null);
  }

  /*
   * --------------------------------------------------
   * Main add-device flow
   *
   * Health Connect is always attempted first.
   *
   * HC available + permission granted
   *       -> Health Connect
   *
   * HC unavailable
   *       -> BLE
   *
   * HC permission denied
   *       -> BLE
   * --------------------------------------------------
   */

  async function handleAddDevice() {
    setErrorMessage(null);
    setConnectionStatus("checking-health-connect");

    try {
      const available = await isHealthConnectAvailable();

      if (available) {
        const connected = await connectHealthConnect();

        /*
         * Health Connect was available but permission
         * wasn't granted, so fall back to BLE.
         */

        if (!connected) {
          await startBleFallback();
        }
      } else {
        /*
         * Health Connect isn't available.
         * Fall back to BLE.
         */

        await startBleFallback();
      }
    } catch (error) {
      console.error("Failed to add device:", error);

      setErrorMessage("Couldn't connect the device. Please try again.");

      setConnectionStatus("error");
    }
  }

  /*
   * --------------------------------------------------
   * Health Connect
   *
   * Returns:
   * true  = Health Connect connected
   * false = permission not granted -> use BLE
   * throws = actual Health Connect failure
   * --------------------------------------------------
   */

  async function connectHealthConnect(): Promise<boolean> {
    setConnectionStatus("requesting-permission");

    const granted = await ensureHealthConnectPermissions();

    /*
     * Permission wasn't granted.
     *
     * This is NOT treated as an error anymore.
     * The caller will start BLE instead.
     */

    if (!granted) {
      console.log(
        "Health Connect permission not granted. Falling back to BLE.",
      );

      return false;
    }

    setConnectionStatus("syncing");

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const source = await getHealthConnectSource(since);

    const deviceName = source?.name ?? "Health Connect";

    const device = await registerDevice({
      name: deviceName,
      vendor: "health-connect",
    });

    await syncHealthDataToBackend(device.id, since);

    setConnectedDeviceId(device.id);

    setConnectedDeviceType("health-connect");

    await fetchDevices();

    setConnectionStatus("idle");

    console.log("Connected through Health Connect:", deviceName);

    return true;
  }

  /*
   * --------------------------------------------------
   * BLE fallback
   * --------------------------------------------------
   */

  async function startBleFallback() {
    setErrorMessage(null);

    const granted = await requestBlePermissions();

    if (!granted) {
      setErrorMessage(
        "Bluetooth permission is required to connect a wearable.",
      );

      setConnectionStatus("error");

      return;
    }

    setBleDevices([]);

    setConnectionStatus("scanning");

    scanForHeartRateDevices((device) => {
      setBleDevices((current) => {
        const exists = current.some((item) => item.id === device.id);

        if (exists) {
          return current;
        }

        return [...current, device];
      });
    });
  }

  /*
   * --------------------------------------------------
   * Select BLE device
   * --------------------------------------------------
   */

  async function handleSelectBleDevice(device: Device) {
    getBleManager().stopDeviceScan();

    setConnectionStatus("connecting");
    setErrorMessage(null);

    try {
      const deviceName =
        device.name || device.localName || "Bluetooth Wearable";

      /*
       * Register the actual discovered BLE device.
       */

      const registeredDevice = await registerDevice({
        name: deviceName,
        vendor: "BLE",
      });

      /*
       * Connect to the exact Device returned
       * from the BLE scan.
       */

      await connectToDevice(device, registeredDevice.id);

      setConnectedDeviceId(registeredDevice.id);

      setConnectedDeviceType("ble");

      setBleDevices([]);

      await fetchDevices();

      setConnectionStatus("idle");

      console.log("Connected through BLE:", deviceName);
    } catch (error) {
      console.error("Failed to connect BLE device:", error);

      setErrorMessage("Couldn't connect to this Bluetooth device.");

      setConnectionStatus("error");
    }
  }

  /*
   * --------------------------------------------------
   * Select an existing registered device
   * --------------------------------------------------
   */

  function handleSelectDevice(deviceId: string) {
    setConnectedDeviceId(deviceId);
  }

  /*
   * --------------------------------------------------
   * Remove device confirmation
   * --------------------------------------------------
   */

  function handleRemoveDevice(device: BackendDevice) {
    Alert.alert(
      "Remove Device",
      `Are you sure you want to remove ${device.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeDevice(device),
        },
      ],
    );
  }

  /*
   * --------------------------------------------------
   * Remove device
   * --------------------------------------------------
   */

  async function removeDevice(device: BackendDevice) {
    setConnectionStatus("removing");
    setErrorMessage(null);

    try {
      /*
       * Only disconnect through BLE if the device
       * being removed is actually a BLE device.
       */

      if (connectedDeviceId === device.id && connectedDeviceType === "ble") {
        await disconnectBleDevice();
      }

      /*
       * Clear the local selected device regardless
       * of whether it was Health Connect or BLE.
       */

      if (connectedDeviceId === device.id) {
        clearConnectedDevice();
      }

      await deleteDevice(device.id);

      await fetchDevices();

      setConnectionStatus("idle");
    } catch (error) {
      console.error("Failed to remove device:", error);

      setErrorMessage("Couldn't remove the device. Please try again.");

      setConnectionStatus("error");
    }
  }

  /*
   * --------------------------------------------------
   * UI state
   * --------------------------------------------------
   */

  const isBusy =
    connectionStatus === "checking-health-connect" ||
    connectionStatus === "requesting-permission" ||
    connectionStatus === "syncing" ||
    connectionStatus === "scanning" ||
    connectionStatus === "connecting" ||
    connectionStatus === "removing";

  const isRemoving = connectionStatus === "removing";

  /*
   * --------------------------------------------------
   * Render
   * --------------------------------------------------
   */

  return (
    <SafeAreaView className="flex-1 px-10 pt-4">
      <Text className="text-3xl font-[Coiny] text-black/65">Connect</Text>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : bleDevices.length > 0 ? (
        /*
         * ------------------------------------------------
         * BLE device selection screen
         * ------------------------------------------------
         */
        <View className="flex-1 pt-8">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="font-[Coiny] uppercase text-[#727272]">
              Bluetooth Devices
            </Text>

            <Pressable
              onPress={cancelBleSearch}
              className="rounded-xl bg-black px-4 py-2"
            >
              <Text className="font-[Coiny] text-white">Cancel Search</Text>
            </Pressable>
          </View>

          <Text className="mb-6 font-[Coiny] text-[#727272]">
            Select the wearable you want to connect.
          </Text>

          <View className="gap-4">
            {bleDevices.map((device) => {
              const deviceName =
                device.name || device.localName || "Unknown Wearable";

              return (
                <Pressable
                  key={device.id}
                  onPress={() => handleSelectBleDevice(device)}
                  disabled={connectionStatus === "connecting"}
                  className="rounded-2xl border-4 border-[#a0a0a0] bg-[#e9e9e9] p-5"
                >
                  <View className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-black">
                      <MaterialIcons name="bluetooth" size={28} color="white" />
                    </View>

                    <View className="flex-1">
                      <Text className="font-[Coiny] text-xl text-black">
                        {deviceName}
                      </Text>

                      <Text className="mt-1 font-[Coiny] text-sm text-[#727272]">
                        {device.id}
                      </Text>
                    </View>

                    {connectionStatus === "connecting" ? (
                      <ActivityIndicator />
                    ) : (
                      <MaterialIcons
                        name="chevron-right"
                        size={30}
                        color="#727272"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : devices.length === 0 ? (
        /*
         * ------------------------------------------------
         * Empty state
         * ------------------------------------------------
         */
        <View className="flex-1 items-center justify-center">
          <Pressable
            onPress={handleAddDevice}
            disabled={isBusy}
            className="mb-10 rounded-2xl border-4 border-[#a0a0a0] bg-[#e9e9e9] px-5 py-4"
          >
            {isBusy ? (
              <ActivityIndicator size={86} />
            ) : (
              <MaterialIcons name="add" size={86} color="black" />
            )}
          </Pressable>

          <Text className="text-center font-[Coiny] text-2xl text-black">
            No devices yet!
          </Text>

          <Text className="mt-2 text-center font-[Coiny] text-[#727272]">
            Connect a wearable to start monitoring your data in real time
          </Text>

          {connectionStatus === "scanning" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Searching for Bluetooth devices...
              </Text>

              <Pressable
                onPress={cancelBleSearch}
                className="mt-4 rounded-xl bg-black px-5 py-3"
              >
                <Text className="font-[Coiny] text-white">Cancel Search</Text>
              </Pressable>
            </View>
          )}

          {connectionStatus === "checking-health-connect" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Checking Health Connect...
              </Text>
            </View>
          )}

          {connectionStatus === "requesting-permission" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Checking permissions...
              </Text>
            </View>
          )}

          {connectionStatus === "syncing" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Syncing Health Connect data...
              </Text>
            </View>
          )}

          {errorMessage && (
            <Text className="mt-4 text-center font-[Coiny] text-red-500">
              {errorMessage}
            </Text>
          )}
        </View>
      ) : (
        /*
         * ------------------------------------------------
         * Registered devices
         * ------------------------------------------------
         */
        <View className="flex-1">
          <View className="flex-row items-center justify-between pt-8">
            <Text className="font-[Coiny] uppercase text-[#727272]">
              My Devices
            </Text>

            <Pressable
              onPress={handleAddDevice}
              disabled={isBusy}
              className="flex-row items-center rounded-xl bg-black px-4 py-2"
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="add" size={20} color="white" />

                  <Text className="ml-1 font-[Coiny] text-white">
                    Add Device
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View className="gap-6 pt-6">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                name={device.name}
                battery={device.battery ?? 0}
                selected={connectedDeviceId === device.id}
                removing={isRemoving}
                onSelect={() => handleSelectDevice(device.id)}
                onRemove={() => handleRemoveDevice(device)}
              />
            ))}
          </View>

          {connectionStatus === "scanning" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Searching for Bluetooth devices...
              </Text>

              <Pressable
                onPress={cancelBleSearch}
                className="mt-4 rounded-xl bg-black px-5 py-3"
              >
                <Text className="font-[Coiny] text-white">Cancel Search</Text>
              </Pressable>
            </View>
          )}

          {connectionStatus === "checking-health-connect" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Checking Health Connect...
              </Text>
            </View>
          )}

          {connectionStatus === "requesting-permission" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Checking permissions...
              </Text>
            </View>
          )}

          {connectionStatus === "syncing" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Syncing Health Connect data...
              </Text>
            </View>
          )}

          {connectionStatus === "connecting" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Connecting to wearable...
              </Text>
            </View>
          )}

          {connectionStatus === "removing" && (
            <View className="mt-6 items-center">
              <ActivityIndicator />

              <Text className="mt-2 font-[Coiny] text-[#727272]">
                Removing device...
              </Text>
            </View>
          )}

          {errorMessage && (
            <Text className="mt-4 text-center font-[Coiny] text-red-500">
              {errorMessage}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
