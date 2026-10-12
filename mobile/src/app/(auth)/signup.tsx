import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import GoogleSignInButton from "@/components/buttons/googleSignInButton";
import { signUpWithEmail, signInWithGoogle } from "@/lib/firebase/auth";

const signUpSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "Display name is required")
      .min(2, "Display name must be at least 2 characters"),

    email: z.email("Enter a valid email address"),

    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpForm = z.infer<typeof signUpSchema>;

export default function Signup() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpForm) => {
    try {
      await signUpWithEmail(data.email, data.password, data.displayName);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create account.";

      Alert.alert("Registration Failed", message);
    }
  };

  const onGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      await signInWithGoogle();

      // Firebase auth listener handles successful navigation.
      // Cancelling Google Sign-In is not treated as an error.
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
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1 px-12"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View className="pt-20">
            <Image
              source={require("@/assets/images/logo.png")}
              className="mx-auto h-44 w-44"
              resizeMode="contain"
            />
          </View>

          {/* Display Name */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium">Display Name</Text>

            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-lg border border-gray-300 px-4 py-3 focus:border-black"
                  placeholder="Enter your display name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  returnKeyType="next"
                />
              )}
            />

            {errors.displayName && (
              <Text className="mt-1 text-sm text-red-500">
                {errors.displayName.message}
              </Text>
            )}
          </View>

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
          <View className="mb-4">
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
                  returnKeyType="next"
                />
              )}
            />

            {errors.password && (
              <Text className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium">Confirm Password</Text>

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-lg border border-gray-300 px-4 py-3 text-black focus:border-black"
                  placeholder="Confirm your password"
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

            {errors.confirmPassword && (
              <Text className="mt-1 text-sm text-red-500">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          {/* Register */}
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
              <Text className="text-center font-semibold text-white">
                Register
              </Text>
            )}
          </Pressable>

          {/* Login Link */}
          <Text className="pt-4 text-center font-bold">
            Already have an account?
            <Link href="/(auth)/login">
              <Text className="text-[#2563EB] underline"> Sign in</Text>
            </Link>
          </Text>

          {/* Google Sign In */}
          <View className="mb-8 justify-center pt-12">
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
