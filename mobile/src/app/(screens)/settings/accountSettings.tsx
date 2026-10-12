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
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [updatingName, setUpdatingName] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const {
    control: displayNameControl,
    handleSubmit: handleDisplayNameSubmit,
    reset: resetDisplayName,
  } = useForm<DisplayNameForm>({
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

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

  useEffect(() => {
    resetDisplayName({
      displayName: user?.displayName || "",
    });
  }, [user?.displayName, resetDisplayName]);

  const handleUpdateName = async (data: DisplayNameForm) => {
    const displayName = data.displayName.trim();

    if (!displayName) {
      Alert.alert("Invalid name", "Please enter your display name.");
      return;
    }

    try {
      setUpdatingName(true);

      await updateDisplayName(displayName);
      await refreshUser();

      Alert.alert("Success", "Your display name has been updated.");
    } catch (error: unknown) {
      console.error("Update display name error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update display name.",
      );
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
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="font-[Coiny] text-center text-gray-600">
          You must be logged in to access account settings.
        </Text>
      </SafeAreaView>
    );
  }

  const inputClass =
    "rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900";

  const buttonClass =
    "mt-5 min-h-14 flex-row items-center justify-center rounded-xl bg-blue-600 px-5 py-4";

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
            paddingTop: 24,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-8">
            <Text className="font-[Coiny] text-3xl text-gray-900">
              Account Settings
            </Text>

            <Text className="mt-2 text-sm text-gray-500">
              Manage your account details.
            </Text>
          </View>

          {/* Personal Information */}
          <View>
            <Text className="font-[Coiny] text-xl text-gray-900">
              Personal Information
            </Text>

            <Text className="mb-5 mt-1 text-sm text-gray-500">
              Update the name shown on your account.
            </Text>

            <Text className="mb-2 font-[Coiny] text-gray-700">
              Display Name
            </Text>

            <Controller
              control={displayNameControl}
              name="displayName"
              rules={{
                required: "Display name is required",
                minLength: {
                  value: 2,
                  message: "Display name must be at least 2 characters",
                },
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
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                    className={`${inputClass} ${error ? "border-red-400" : ""}`}
                  />

                  {error && (
                    <Text className="mt-2 text-sm text-red-500">
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />

            <TouchableOpacity
              className={`${buttonClass} ${updatingName ? "opacity-60" : ""}`}
              activeOpacity={0.75}
              onPress={handleDisplayNameSubmit(handleUpdateName)}
              disabled={updatingName}
            >
              <Text className="font-[Coiny] text-base text-white">
                {updatingName ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="my-9 border-t border-gray-200" />

          {/* Password */}
          <View>
            <Text className="font-[Coiny] text-xl text-gray-900">Password</Text>

            <Text className="mb-5 mt-1 text-sm text-gray-500">
              Choose a new password for your account.
            </Text>

            {/* New Password */}
            <Text className="mb-2 font-[Coiny] text-gray-700">
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
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    className={`${inputClass} ${error ? "border-red-400" : ""}`}
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
            <Text className="mb-2 mt-5 font-[Coiny] text-gray-700">
              Confirm New Password
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
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    className={`${inputClass} ${error ? "border-red-400" : ""}`}
                  />

                  {error && (
                    <Text className="mt-2 text-sm text-red-500">
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />

            <TouchableOpacity
              className={`${buttonClass} ${
                updatingPassword ? "opacity-60" : ""
              }`}
              activeOpacity={0.75}
              onPress={handlePasswordSubmit(handleUpdatePassword)}
              disabled={updatingPassword}
            >
              <Text className="font-[Coiny] text-base text-white">
                {updatingPassword ? "Updating..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
