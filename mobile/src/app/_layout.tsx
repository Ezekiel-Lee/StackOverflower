import { Stack } from "expo-router";
import { useFonts, Coiny_400Regular } from "@expo-google-fonts/coiny";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Coiny: Coiny_400Regular,
  });

  if (!fontsLoaded) return null;
  
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
