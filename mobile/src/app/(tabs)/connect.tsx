import DeviceCard from "@/components/cards/deviceCard";
import { deleteDevice, getDevices, registerDevice } from "@/lib/api";
import { ensureHealthConnectPermissions } from "@/lib/health/permissions";
import { syncHealthDataToBackend } from "@/lib/health/syncHealthData";
import { useDeviceStore } from "@/store/deviceStore";

import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Device = {
  id: string;
  name: string;
  battery?: number;
};

type ConnectStatus =
  "idle" | "requesting-permission" | "syncing" | "removing" | "error";

export default function Connect() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");

  const connectedDeviceId = useDeviceStore((state) => state.connectedDeviceId);

  const setConnectedDeviceId = useDeviceStore(
    (state) => state.setConnectedDeviceId,
  );

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const data = await getDevices();
      setDevices(data);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDevice() {
    setConnectStatus("requesting-permission");

    try {
      const granted = await ensureHealthConnectPermissions();

      if (!granted) {
        console.warn("Health Connect permission not granted");
        setConnectStatus("error");
        return;
      }

      setConnectStatus("syncing");

      const device = await registerDevice({
        name: "My Watch",
        vendor: "health-connect",
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await syncHealthDataToBackend(device.id, oneDayAgo);

      setConnectedDeviceId(device.id);

      await fetchDevices();

      setConnectStatus("idle");
    } catch (error) {
      console.error("Failed to connect device:", error);
      setConnectStatus("error");
    }
  }

  function handleSelectDevice(deviceId: string) {
    setConnectedDeviceId(deviceId);
  }

  function handleRemoveDevice(device: Device) {
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

  async function removeDevice(device: Device) {
    setConnectStatus("removing");

    try {
      await deleteDevice(device.id);

      if (connectedDeviceId === device.id) {
        setConnectedDeviceId(null);
      }

      await fetchDevices();

      setConnectStatus("idle");
    } catch (error) {
      console.error("Failed to remove device:", error);
      setConnectStatus("error");
    }
  }

  const isConnecting =
    connectStatus === "requesting-permission" || connectStatus === "syncing";

  const isRemoving = connectStatus === "removing";

  return (
    <SafeAreaView className="flex-1 px-10 pt-4">
      <Text className="text-3xl font-[Coiny] text-black/65">Connect</Text>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : devices.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Pressable
            onPress={handleAddDevice}
            disabled={isConnecting || isRemoving}
            className="mb-10 rounded-2xl border-4 border-[#a0a0a0] bg-[#e9e9e9] px-5 py-4"
          >
            {isConnecting ? (
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

          {connectStatus === "error" && (
            <Text className="mt-4 text-center font-[Coiny] text-red-500">
              Couldn't connect. Make sure Health Connect is set up and try
              again.
            </Text>
          )}
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-row items-center justify-between pt-8">
            <Text className="font-[Coiny] uppercase text-[#727272]">
              My Devices
            </Text>

            <Pressable
              onPress={handleAddDevice}
              disabled={isConnecting || isRemoving}
              className="flex-row items-center rounded-xl bg-black px-4 py-2"
            >
              {isConnecting ? (
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

          {connectStatus === "error" && (
            <Text className="mt-4 text-center font-[Coiny] text-red-500">
              Couldn't complete the device action. Please try again.
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
