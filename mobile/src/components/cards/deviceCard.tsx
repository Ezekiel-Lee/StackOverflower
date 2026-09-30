import { View, Image, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

type Props = {
  name: string;
  battery: number;
};

export default function DeviceCard({ name, battery }: Props) {
  return (
    <View className=" bg-[#D9D9D9] px-6 py-5 rounded-3xl flex-row items-center">
      <Image
        source={require("@/assets/images/green-rectangle.png")}
        className="h-4 w-4 "
      />
      <View className=" pl-4">
        <Text className="font-[Coiny] text-[#5f5f5f] leading-snug">{name}</Text>
        <Text className="font-[Coiny] text-[#5f5f5f] leading-snug">{battery}%</Text>
      </View>
      <View className="flex-row ml-auto pr-2 gap-3">
        <Feather name="edit-2" size={24} color="black" />
        <FontAwesome5 name="trash-alt" size={24} color="black" />
      </View>
    </View>
  );
}
