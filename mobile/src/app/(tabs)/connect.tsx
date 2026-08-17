import DeviceCard from "@/components/cards/deviceCard";
import { getDevices } from "@/lib/api";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Device = {
  id: number;
  name: string;
  battery: number;
};

export default function Connect() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchDevices();
  }, []);

  const onConnect = () => {
    console.log("Connect Device")
  }

  return (
    <SafeAreaView className="flex-1 px-10 pt-4">
      <Text className="text-3xl font-[Coiny] text-black/65">Connect</Text>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : devices.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Pressable onPress={onConnect} className="border-4 px-5 py-4 rounded-2xl border-[#a0a0a0] mb-10 bg-[#e9e9e9]">
            <MaterialIcons name="add" size={86} color="black" />
          </Pressable>
          <Text className="text-center font-[Coiny] text-2xl text-black">
            No devices yet!
          </Text>

          <Text className="mt-2 font-[Coiny] text-center text-[#727272]">
            Connect a wearable to start monitoring your data in real time
          </Text>
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
                battery={device.battery}
              />
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
