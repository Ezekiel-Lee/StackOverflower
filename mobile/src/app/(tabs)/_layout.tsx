import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,

        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 14,
        },

        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Summary",
        }}
      />

      <Tabs.Screen
        name="connect"
        options={{
          title: "Connect",
        }}
      />

      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
        }}
      />
    </Tabs>
  );
}