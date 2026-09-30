import { Text, View } from "react-native";
import type { ReactNode } from "react";

type Props = {
  title: string;
  icon: ReactNode;
};

export default function DashboardSection({ title, icon }: Props) {
  return (
    <View className="flex-row items-center px-4 pt-8">
      {icon}

      <Text className="ml-2 font-coiny text-2xl text-dark-green">{title}</Text>
    </View>
  );
}
