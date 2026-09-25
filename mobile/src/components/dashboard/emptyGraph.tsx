import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  onAdd: () => void;
};

export default function EmptyGraph({ onAdd }: Props) {
  return (
    <View className="rounded-2xl bg-green-50 px-4 py-8">
      <View className="items-center">
        <Ionicons name="analytics-outline" size={42} color="#166534" />

        <Text className="mt-3 font-coiny text-xl text-dark-green">
          No graph selected
        </Text>

        <Text className="mt-1 text-center text-sm text-gray-500">
          Choose a sensor to display its readings.
        </Text>

        <TouchableOpacity
          onPress={onAdd}
          className="mt-5 flex-row items-center rounded-full bg-dark-green px-5 py-3"
        >
          <Ionicons name="add" size={20} color="white" />

          <Text className="ml-2 font-coiny text-white">Add Graph</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
