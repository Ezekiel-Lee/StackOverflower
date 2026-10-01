import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getData } from "@/lib/api";
import { getSensorStyle } from "@/lib/sensorStyles";
import { getLatestReading } from "@/lib/sensorUtils";
import type { SensorData } from "@/types/sensor";
import { useDeviceStore } from "@/store/deviceStore";

export default function Summary() {
  const connectedDeviceId = useDeviceStore((state) => state.connectedDeviceId);

  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSensorData = useCallback(async () => {
    if (!connectedDeviceId) {
      setSensorData([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getData(connectedDeviceId);
      setSensorData(data);
    } catch (error) {
      console.error("Failed to load sensor data:", error);
      setSensorData([]);
    } finally {
      setLoading(false);
    }
  }, [connectedDeviceId]);

  useEffect(() => {
    setLoading(true);
    loadSensorData();
  }, [loadSensorData]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadSensorData();
    } finally {
      setRefreshing(false);
    }
  }

  const sensorTypes = Array.from(
    new Set(sensorData.map((reading) => reading.sensor_type)),
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />

          <Text className="mt-3 font-coiny text-gray-500">
            Loading sensor data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!connectedDeviceId) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="watch-outline" size={56} color="#166534" />

          <Text className="mt-4 font-coiny text-2xl text-dark-green">
            No device connected
          </Text>

          <Text className="mt-2 text-center text-gray-500">
            Connect a wearable to view your sensor data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sensorData.length === 0) {
    return (
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="items-center">
            <Ionicons name="analytics-outline" size={56} color="#166534" />

            <Text className="mt-4 font-coiny text-2xl text-dark-green">
              No sensor data
            </Text>

            <Text className="mt-2 text-center text-gray-500">
              Sensor readings will appear here once your wearable starts syncing
              data.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 100,
        }}
      >
        <Text className="font-coiny text-3xl text-black/65">Summary</Text>

        <Text className="mt-1 font-coiny text-gray-500">
          Latest readings from your wearable
        </Text>

        <View className="mt-6 gap-4">
          {sensorTypes.map((sensorType) => {
            const reading = getLatestReading(sensorData, sensorType);

            if (!reading) {
              return null;
            }

            const style = getSensorStyle(sensorType);

            return (
              <View
                key={sensorType}
                className={`rounded-2xl px-5 py-5 ${style.card}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
                      <Ionicons
                        name={style.icon}
                        size={27}
                        color={style.iconColor}
                      />
                    </View>

                    <View className="ml-4">
                      <Text className="font-coiny text-lg text-gray-700">
                        {style.name}
                      </Text>

                      <Text className="mt-1 text-sm text-gray-500">
                        Latest reading
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <View className="flex-row items-baseline">
                      <Text className="font-coiny text-2xl text-dark-green">
                        {reading.value}
                      </Text>

                      {reading.unit && (
                        <Text className="ml-1 text-sm text-gray-500">
                          {reading.unit}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
