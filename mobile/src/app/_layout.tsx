import { Stack, Redirect, useSegments } from "expo-router";
import { useFonts, Coiny_400Regular } from "@expo-google-fonts/coiny";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Coiny: Coiny_400Regular,
  });

  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = initializeAuth();

    return unsubscribe;
  }, [initializeAuth]);

  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </SafeAreaProvider>
  );
}
