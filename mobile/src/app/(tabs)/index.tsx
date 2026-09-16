import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView>
      <Text className="text-blue-500 text-center font-bold pt-10 text-3xl">Home</Text>
      <Link href="/notifications">
        <Ionicons name="notifications-outline" size={24} color="#000" />
      </Link>
    </SafeAreaView>
  );
}

