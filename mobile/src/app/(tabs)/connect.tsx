import DeviceCard from "@/components/cards/deviceCard";
import { getDevices, registerDevice } from "@/lib/api";
import { ensureHealthConnectPermissions } from "@/lib/health/permissions";
import { syncHealthDataToBackend } from "@/lib/health/syncHealthData";
import { useDeviceStore } from "@/store/deviceStore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// NOTE: id is a string (Firebase/Postgres GUID from the backend), not a
// number -- fixed here, this was previously typed as `number`.
// battery is left optional -- the backend has no battery field yet
// (flagged in the System Maintenance Document, Section 15).
type Device = {
  id: string;
  name: string;
  battery?: number;
};

type ConnectStatus = "idle" | "requesting-permission" | "syncing" | "error";

export default function Connect() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");

  const setConnectedDeviceId = useDeviceStore((state) => state.setConnectedDeviceId);

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

  // Wired to the Health Connect path (see src/lib/health/), since that's
  // the one we can test today against the Xiaomi band via Mi Fitness.
  // The standard-BLE path (src/lib/ble/, useHeartRateDevice) is a drop-in
  // alternative for devices with no vendor app -- swap this handler for
  // that hook's `connect()` to offer it instead, or branch on a user choice.
  const onConnect = async () => {
    setConnectStatus("requesting-permission");

    const granted = await ensureHealthConnectPermissions();
    if (!granted) {
      console.warn("Health Connect permission not granted");
      setConnectStatus("error");
      return;
    }

    try {
      setConnectStatus("syncing");

      const device = await registerDevice({ name: "My Watch", vendor: "health-connect" });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await syncHealthDataToBackend(device.id, oneDayAgo);

      // This is what the Dashboard (src/app/(tabs)/index.tsx) reads to
      // know which device's data to show -- previously hardcoded to "".
      setConnectedDeviceId(device.id);

      await fetchDevices();
      setConnectStatus("idle");
    } catch (error) {
      console.error("Failed to connect device:", error);
      setConnectStatus("error");
    }
  };

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
            onPress={onConnect}
            disabled={connectStatus === "requesting-permission" || connectStatus === "syncing"}
            className="border-4 px-5 py-4 rounded-2xl border-[#a0a0a0] mb-10 bg-[#e9e9e9]"
          >
            {connectStatus === "requesting-permission" || connectStatus === "syncing" ? (
              <ActivityIndicator size={86} />
            ) : (
              <MaterialIcons name="add" size={86} color="black" />
            )}
          </Pressable>
          <Text className="text-center font-[Coiny] text-2xl text-black">
            No devices yet!
          </Text>

          <Text className="mt-2 font-[Coiny] text-center text-[#727272]">
            Connect a wearable to start monitoring your data in real time
          </Text>

          {connectStatus === "error" && (
            <Text className="mt-4 font-[Coiny] text-center text-red-500">
              Couldn't connect. Make sure Health Connect is set up and try again.
            </Text>
          )}
        </View>
      ) : (
        <>
          <Text className="pt-8 font-[Coiny] uppercase text-[#727272]">
            My Devices
          </Text>
          <View className="gap-8 pt-6">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                name={device.name}
                battery={device.battery ?? 0}
              />
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
