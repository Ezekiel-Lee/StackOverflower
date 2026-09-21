import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { LineChart } from "react-native-gifted-charts";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/authStore";
import Pin from "../../../assets/icons/pin.svg";
import Highlights from "@/assets/icons/highlights.svg";

const heartRateData = [
  { value: 72, label: "8 AM" },
  { value: 78, label: "9 AM" },
  { value: 75, label: "10 AM" },
  { value: 83, label: "11 AM" },
  { value: 80, label: "12 PM" },
  { value: 88, label: "1 PM" },
  { value: 82, label: "2 PM" },
  { value: 92, label: "3 PM" },
];

const highlights = [
  {
    name: "Blood Oxygen",
    value: "Healthy",
    icon: "water-outline" as const,
    bg: "bg-blue-100",
  },
  {
    name: "Steps",
    value: "482",
    icon: "footsteps-outline" as const,
    bg: "bg-yellow-100",
  },
  {
    name: "Active Energy",
    value: "1280 kcal",
    icon: "flame-outline" as const,
    bg: "bg-orange-100",
  },
];

export default function Index() {
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView className="flex-1">
      <Text className="px-4 pt-10 text-3xl font-coiny">
        Welcome <Text className="text-dark-green">{user?.displayName}</Text>
      </Text>

      {/* Pinned */}
      <View className="px-4 pt-9">
        <View className="flex-row items-center">
          <Pin width={24} height={24} />
          <Text className="ml-2 font-coiny text-2xl text-dark-green">
            Pinned
          </Text>
        </View>
      </View>

      {/* Heart Rate */}
      <View className="mx-4 mt-4 rounded-2xl bg-green-50 px-3 pb-4 pt-4">
        {/* Graph Header */}
        <View className="mb-2 flex-row items-center justify-between">
          <View>
            <Text className="font-coiny text-xl text-dark-green">
              Heart Rate
            </Text>

            <Text className="mt-1 text-sm text-gray-500">Today</Text>
          </View>

          <View className="items-end">
            <Text className="font-coiny text-2xl text-dark-green">83</Text>

            <Text className="text-xs text-gray-500">BPM average</Text>
          </View>
        </View>

        {/* Line Graph */}
        <LineChart
          data={heartRateData}
          height={170}
          width={320}
          thickness={3}
          color="#166534"
          curved
          hideRules
          hideYAxisText={false}
          yAxisTextStyle={{
            color: "#6b7280",
            fontSize: 10,
          }}
          xAxisLabelTextStyle={{
            color: "#6b7280",
            fontSize: 9,
          }}
          xAxisColor="#d1d5db"
          yAxisColor="#d1d5db"
          dataPointsColor="#166534"
          dataPointsRadius={4}
          noOfSections={4}
          maxValue={100}
          initialSpacing={10}
          spacing={38}
        />
      </View>

      {/* Highlights */}
      <View className=" px-4 pt-8 flex-row items-center">
        <Highlights width={24} height={24} />
        <Text className="ml-2 font-coiny text-2xl text-dark-green">
          Highlights
        </Text>
      </View>

      {/* Highlight Cards */}
      <View className="mt-4 px-4 flex-row flex-wrap gap-4 ">
        {highlights.map((item) => (
          <View
            key={item.name}
            className={` rounded-2xl px-6 py-4 flex-row items-center w-52  justify-around ${item.bg}`}
          >
            {/* Icon */}
            <View className="mb-3 h-9 w-9 items-center justify-center rounded-full bg-white">
              <Ionicons name={item.icon} size={32} color="#166534" />
            </View>

            <View>
              <Text className="font-coiny text-sm text-gray-600">
                {item.name}
              </Text>

              {/* Value */}
              <Text className=" font-coiny text-lg text-dark-green">
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Notifications */}
      <View className="absolute bottom-20 right-2">
        <Link href="/notifications">
          <Ionicons name="notifications-outline" size={32} color="#000" />
        </Link>
      </View>
    </SafeAreaView>
  );
}
