import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function AppSupport() {
  return (
    <SafeAreaView className="px-6 py-6 ">
      <Text className=" font-[Coiny] text-[#005114] text-2xl ">
        {" "}
        App Support{" "}
      </Text>
      <Text className="font-[Coiny] text-xl text-gray-500 text-center pt-14 pb-4">
        {" "}
        Common F & Q
      </Text>
      <View className="py-7 border-y border-black">
        <Text className=" font-[Coiny] text-sm text-gray-500 ">
          1. Question One
        </Text>
        <Text className=" py-2.5 font-[Coiny] text-sm text-gray-500 text-center ">
          This is an answer for question one . This is an answer for question
          one This is an answer for question one
        </Text>
        <Text className=" font-[Coiny] text-sm text-gray-500 ">
          2. Question Two
        </Text>
        <Text className=" py-2.5 font-[Coiny] text-sm text-gray-500 text-center ">
          This is an answer for question two . This is an answer for question
          two This is an answer for question two
        </Text>
      </View>
      <View>
        <View className=" py-7">
          <View className="flex-row justify-center gap-x-2">
            <Ionicons name="headset-outline" size={28} color="#000" />
            <Text className="font-[Coiny] text-gray-500 text-xl pb-6   ">
              Live Agent Support
            </Text>
          </View>
          <View className="flex-row items-center gap-2 py-4">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={28}
              color="#000"
            />
            <Text className="font-[Coiny] text-gray-500"> Chat with an agent</Text>
          </View>
          <View className="flex-row items-center gap-2 py-4">
            <Ionicons name="call-outline" size={28} color="#000" />
            <Text className="font-[Coiny] text-gray-500"> Call Agent </Text>
          </View>
          <View className="flex-row items-center gap-2 py-4">
            <Ionicons name="mail-outline" size={28} color="#000" />
            <Text className="font-[Coiny] text-gray-500"> dssapp@email.com</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
