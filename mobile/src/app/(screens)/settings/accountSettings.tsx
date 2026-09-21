import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";

import { useAuthStore } from "@/store/authStore";
import { changePassword, updateDisplayName } from "@/lib/firebase/auth";

type DisplayNameForm = {
  displayName: string;
};

type PasswordForm = {
  password: string;
  confirmPassword: string;
};

export default function AccountSettings() {
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser)

  const [updatingName, setUpdatingName] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Display name form
  const {
    control: displayNameControl,
    handleSubmit: handleDisplayNameSubmit,
    reset: resetDisplayName,
  } = useForm<DisplayNameForm>({
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  // Password form
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    getValues,
  } = useForm<PasswordForm>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Keep display name in sync with Firebase user
  useEffect(() => {
    resetDisplayName({
      displayName: user?.displayName || "",
    });
  }, [user?.displayName, resetDisplayName]);

  const handleUpdateName = async (data: DisplayNameForm) => {
    try {
      setUpdatingName(true);

      await updateDisplayName(data.displayName.trim());
      await refreshUser();

      Alert.alert("Success", "Your display name has been updated.");
    } catch (error: any) {
      console.error("Update display name error:", error);

      Alert.alert("Error", error?.message || "Failed to update display name.");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (data: PasswordForm) => {
    try {
      setUpdatingPassword(true);

      await changePassword(data.password);

      resetPassword();

      Alert.alert("Success", "Your password has been updated.");
    } catch (error: any) {
      console.error("Change password error:", error);

      if (error?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Sign in required",
          "Please sign in again before changing your password.",
        );
      } else {
        Alert.alert("Error", error?.message || "Failed to update password.");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">
          You must be logged in to access account settings.
        </Text>
      </SafeAreaView>
    );
  }

  const avatarLetter = (user.displayName || "U").charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="pb-6 pt-8">
            <Text className="text-4xl font-[Coiny] text-gray-900">
              Account Settings
            </Text>

            <Text className="pt-2 font-[Coiny] text-gray-500">
              Update your account details
            </Text>
          </View>

          {/* Profile Card */}
          <View className="items-center rounded-3xl bg-gray-50 p-6">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-100">
              <Text className="text-3xl font-bold text-blue-600">
                {avatarLetter}
              </Text>
            </View>

            <Text className="mt-4 text-xl font-bold text-gray-900">
              {user.displayName || "User"}
            </Text>

            <Text className="mt-1 text-gray-500">{user.email}</Text>
          </View>

          {/* Display Name */}
          <View className="mt-8">
            <Text className="mb-3 text-sm font-semibold uppercase text-gray-400">
              Display Name
            </Text>

            <View className="rounded-2xl bg-gray-50 p-4">
              <Text className="mb-2 text-sm font-medium text-gray-600">
                Name
              </Text>

              <Controller
                control={displayNameControl}
                name="displayName"
                rules={{
                  required: "Display name is required",
                  validate: (value) =>
                    value.trim().length > 0 || "Display name is required",
                }}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter your display name"
                      autoCapitalize="words"
                      className={`rounded-xl bg-white px-4 py-4 text-base text-gray-900 ${
                        error ? "border border-red-400" : ""
                      }`}
                    />

                    {error && (
                      <Text className="mt-2 text-sm text-red-500">
                        {error.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            <TouchableOpacity
              className="mt-4 items-center rounded-2xl bg-green-600 py-4"
              activeOpacity={0.8}
              onPress={handleDisplayNameSubmit(handleUpdateName)}
              disabled={updatingName}
            >
              <Text className="font-semibold text-white">
                {updatingName ? "Updating..." : "Update Display Name"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password */}
          <View className="mt-8">
            <Text className="mb-3 text-sm font-semibold uppercase text-gray-400">
              Password
            </Text>

            <View className="rounded-2xl bg-gray-50 p-4">
              {/* New Password */}
              <Text className="mb-2 text-sm font-medium text-gray-600">
                New Password
              </Text>

              <Controller
                control={passwordControl}
                name="password"
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                }}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter new password"
                      secureTextEntry
                      autoCapitalize="none"
                      className={`rounded-xl bg-white px-4 py-4 text-base text-gray-900 ${
                        error ? "border border-red-400" : ""
                      }`}
                    />

                    {error && (
                      <Text className="mt-2 text-sm text-red-500">
                        {error.message}
                      </Text>
                    )}
                  </>
                )}
              />

              {/* Confirm Password */}
              <Text className="mb-2 mt-4 text-sm font-medium text-gray-600">
                Confirm Password
              </Text>

              <Controller
                control={passwordControl}
                name="confirmPassword"
                rules={{
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === getValues("password") || "Passwords do not match",
                }}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Confirm new password"
                      secureTextEntry
                      autoCapitalize="none"
                      className={`rounded-xl bg-white px-4 py-4 text-base text-gray-900 ${
                        error ? "border border-red-400" : ""
                      }`}
                    />

                    {error && (
                      <Text className="mt-2 text-sm text-red-500">
                        {error.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            <TouchableOpacity
              className="mt-4 items-center rounded-2xl bg-green-600 py-4"
              activeOpacity={0.8}
              onPress={handlePasswordSubmit(handleUpdatePassword)}
              disabled={updatingPassword}
            >
              <Text className="font-semibold text-white">
                {updatingPassword ? "Updating..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
