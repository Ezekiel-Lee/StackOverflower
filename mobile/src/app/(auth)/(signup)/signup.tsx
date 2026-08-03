import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function Signup() {
  return (
    <View className="mt-60 ml-10">
      <Text> Sign up page</Text>
      <Link href="/(tabs)"> Go to home </Link>
    </View>
  );
}
