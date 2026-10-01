import { Stack, Redirect, useSegments } from "expo-router";
import { useFonts, Coiny_400Regular } from "@expo-google-fonts/coiny";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, Platform, View } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  defineHealthSyncTask,
  registerHealthSync,
} from "@/lib/health/backgroundSync";

// Register background task once when the app loads.
if (Platform.OS === "android") {
  defineHealthSyncTask();
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Coiny: Coiny_400Regular,
  });

  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  const segments = useSegments();

  // Initialize Firebase authentication listener.
  useEffect(() => {
    const unsubscribe = initializeAuth();

    return unsubscribe;
  }, [initializeAuth]);

  // Register health background sync after authentication.
  useEffect(() => {
    if (user && Platform.OS === "android") {
      registerHealthSync().catch((error) => {
        console.warn("Failed to register background sync:", error);
      });
    }
  }, [user]);

  // Wait until fonts and authentication state are ready.
  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  // User is NOT authenticated.
  // They are only allowed to access auth screens.
  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // User IS authenticated.
  // They are not allowed to access auth screens.
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
