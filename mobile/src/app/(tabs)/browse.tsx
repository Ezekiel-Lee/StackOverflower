import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Browse() {
  return (
    <View>
      <Text className="text-blue-500 text-center font-bold pt-10 text-3xl">
        More
      </Text>
      {/* only for testing */}
      <Link href="/(auth)/login">
        <Text> Check Auth page</Text>
      </Link>
    </View>
  );
}
