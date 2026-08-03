import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function Login() {
  return (
    <View className=" mt-60 ml-10">
      <Text> Login page</Text>
      <Link href='/(auth)/(signup)/signup'>
        <Text className="text-purple-400"> Sign up instead</Text>
      </Link>
    </View>
  );
}
