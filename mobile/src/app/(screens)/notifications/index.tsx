import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const data = [
    {
        id: 1,
        message: " This is notification 1"
    },
        {
        id: 2,
        message: " This is notification 2"
    },
        {
        id: 3,
        message: " This is notification 3"
    },
        {
        id: 4,
        message: " This is notification 4"
    },
]

export default function Notifications() {
  return (
    <SafeAreaView>
      <View>
        <Text className="font-[Coiny] text-[#005114] text-2xl pb-7 pt-4 px-4"> Notifications </Text>
      </View>
      <View className="mx-4 rounded-2xl border-2 border-green-900 bg-[#D7FAE0]">
        {data.map((noti) => {
            return (
                <View key={noti.id} className="flex-row  border-b items-center justify-between">
                    <Text className="px-4 py-6">{noti.message}</Text>
                    <Pressable className="pr-6">
                        <Ionicons name="trash-outline" size={22} />
                    </Pressable>
                </View>
            )
        })}
      </View>
    </SafeAreaView>
  );
}
