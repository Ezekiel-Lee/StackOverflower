import { Text, View } from "react-native";

import Pin from "@/assets/icons/pin.svg";

type Props = {
  displayName?: string | null;
};

export default function DashboardHeader({ displayName }: Props) {
  return (
    <>
      <Text className="px-4 pt-8 text-3xl font-coiny">
        Welcome <Text className="text-dark-green">{displayName ?? "User"}</Text>
      </Text>

      <View className="px-4 pt-8">
        <View className="flex-row items-center">
          <Pin width={24} height={24} />

          <Text className="ml-2 font-coiny text-2xl text-dark-green">
            Pinned
          </Text>
        </View>
      </View>
    </>
  );
}
