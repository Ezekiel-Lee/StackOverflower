import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import GoogleSignInButton from "@/components/buttons/googleSignInButton";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth";

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInForm) => {
    try {
      await signInWithEmail(data.email, data.password);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to log in.";

      Alert.alert("Login Failed", message);
    }
  };

  const onGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      await signInWithGoogle();

      // If the user cancels, signInWithGoogle returns null.
      // Your Firebase auth listener handles successful navigation.
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to sign in with Google.";

      Alert.alert("Google Sign-In Failed", message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 px-12 pt-20">
      <Image
        source={require("@/assets/images/logo.png")}
        className="mx-auto h-44 w-44"
        resizeMode="contain"
      />

      {/* Email */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-medium">Email</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-4 py-3 focus:border-black"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              returnKeyType="next"
            />
          )}
        />

        {errors.email && (
          <Text className="mt-1 text-sm text-red-500">
            {errors.email.message}
          </Text>
        )}
      </View>

      {/* Password */}
      <View className="mb-6">
        <Text className="mb-2 text-sm font-medium">Password</Text>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-4 py-3 text-black focus:border-black"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />

        {errors.password && (
          <Text className="mt-1 text-sm text-red-500">
            {errors.password.message}
          </Text>
        )}
      </View>

      {/* Email Sign In */}
      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting || googleLoading}
        className={`rounded-full py-4 ${
          isSubmitting || googleLoading ? "bg-gray-400" : "bg-[#787171]"
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center font-semibold text-white">Sign In</Text>
        )}
      </Pressable>

      {/* Signup Link */}
      <Text className="pt-4 text-center font-bold">
        Don't have an account?
        <Link href="/(auth)/signup">
          <Text className="text-[#2563EB] underline"> Sign up</Text>
        </Link>
      </Text>

      {/* Google Sign In */}
      <View className="mt-12 justify-center">
        {googleLoading ? (
          <View className="flex-row items-center justify-center py-3">
            <ActivityIndicator color="#4285F4" />
            <Text className="ml-2 text-gray-700">
              Signing in with Google...
            </Text>
          </View>
        ) : (
          <GoogleSignInButton onPress={onGoogleSignIn} />
        )}
      </View>
    </SafeAreaView>
  );
}
