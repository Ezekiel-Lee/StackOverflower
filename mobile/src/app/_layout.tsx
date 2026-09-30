import { Stack, Redirect, useSegments } from "expo-router";
import { useFonts, Coiny_400Regular } from "@expo-google-fonts/coiny";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, Platform, View } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { defineHealthSyncTask, registerHealthSync } from "@/lib/health/backgroundSync";

// Must run once at module load (not inside the component) so the task is
// registered even when this screen isn't currently mounted.
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

  useEffect(() => {
    const unsubscribe = initializeAuth();

    return unsubscribe;
  }, [initializeAuth]);

  // Once a user is signed in, start the periodic background sync.
  // Safe to call repeatedly -- registerTaskAsync no-ops if already registered.
  useEffect(() => {
    if (user && Platform.OS === "android") {
      registerHealthSync().catch((e) => console.warn("Failed to register background sync:", e));
    }
  }, [user]);

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
