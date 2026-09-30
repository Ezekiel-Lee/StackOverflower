import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ProfileItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export default function ProfileItem({
  icon,
  title,
  subtitle,
  onPress,
}: ProfileItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4"
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Icon */}
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
        <Ionicons name={icon} size={21} color="#374151" />
      </View>

      {/* Text */}
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-gray-900">{title}</Text>

        <Text className="mt-0.5 text-sm text-gray-500">{subtitle}</Text>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={19} color="#9CA3AF" />
    </TouchableOpacity>
  );
}
