import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const data = [
  {
    name: "Heart Rate",
    value: "80",
  },
  {
    name: "Blood Oxygen",
    value: "Healthy",
  },
  {
    name: "Steps",
    value: "482",
  },
  {
    name: "Active Energy",
    value: "1280kcal",
  },
  {
    name: "Sleep",
    value: "8hrs",
  },
];

const readingMap: Record<
  string,
  {
    icon: keyof typeof Ionicons.glyphMap;
    card: string;
    iconColor: string;
  }
> = {
  "Heart Rate": {
    icon: "heart-outline",
    card: "bg-red-50",
    iconColor: "#ef4444",
  },

  "Blood Oxygen": {
    icon: "water-outline",
    card: "bg-blue-50",
    iconColor: "#3b82f6",
  },

  Steps: {
    icon: "footsteps-outline",
    card: "bg-yellow-50",
    iconColor: "#eab308",
  },

  "Active Energy": {
    icon: "flame-outline",
    card: "bg-orange-50",
    iconColor: "#f97316",
  },

  Sleep: {
    icon: "moon-outline",
    card: "bg-green-50",
    iconColor: "#22c55e",
  },
};

export default function Summary() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="font-[Coiny] text-green-700 text-3xl pb-7 pt-4 px-4">
        Summary.LIVE
      </Text>

      <View className="px-4 gap-3">
        {data.map((reading) => {
          const style = readingMap[reading.name];

          return (
            <View
              key={reading.name}
              className={`flex-row items-center justify-between rounded-2xl px-4 py-4 ${style.card}`}
            >
              {/* Icon and name */}
              <View className="flex-row items-center gap-3">
                <Ionicons name={style.icon} size={26} color={style.iconColor} />

                <Text className="text-gray-700 text-base font-semibold">
                  {reading.name}
                </Text>
              </View>

              {/* Value */}
              <Text className=" bg-gray-200 rounded-lg px-4 py-2 text-lg font-bold">
                {reading.value}
              </Text>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
