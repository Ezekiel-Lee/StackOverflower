import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Props = {
  name: string;
  battery: number;
  selected: boolean;
  removing: boolean;
  onSelect: () => void;
  onRemove: () => void;
};

export default function DeviceCard({
  name,
  battery,
  selected,
  removing,
  onSelect,
  onRemove,
}: Props) {
  return (
    <View className="flex-row items-center rounded-3xl bg-[#D9D9D9] px-5 py-4">
      <Image
        source={require("@/assets/images/green-rectangle.png")}
        className="h-4 w-4"
      />

      <View className="ml-3 flex-1">
        <Text className="font-[Coiny] text-base text-[#5f5f5f]">{name}</Text>

        <Text className="font-[Coiny] text-sm text-[#5f5f5f]">{battery}%</Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onSelect}
          disabled={selected || removing}
          className={`flex-row items-center rounded-xl px-3 py-2 ${
            selected ? "bg-[#B8B8B8]" : "bg-black"
          }`}
        >
          <MaterialIcons
            name={selected ? "check" : "devices"}
            size={18}
            color={selected ? "#5f5f5f" : "white"}
          />

          <Text
            className={`ml-1.5 font-[Coiny] text-sm ${
              selected ? "text-[#5f5f5f]" : "text-white"
            }`}
          >
            {selected ? "Selected" : "Select"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onRemove}
          disabled={removing}
          className="h-9 w-9 items-center justify-center rounded-xl bg-red-100"
        >
          {removing ? (
            <ActivityIndicator size="small" />
          ) : (
            <MaterialIcons name="delete-outline" size={21} color="#dc2626" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
