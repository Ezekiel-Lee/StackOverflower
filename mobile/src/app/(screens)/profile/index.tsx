import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileItem from "@/components/cards/profileItem";
import { getCurrentUser, logOut } from "@/lib/firebase/auth";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const onLogout = async () => {
    try {
      await logOut();
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to Logout");
    }
  };

  const displayName = user?.displayName || "User";
  const email = user?.email || "No email";

  return (
    <SafeAreaView>
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-4xl font-[Coiny] text-gray-900">Profile</Text>

        <Text className="pt-2 text-gray-500 font-[Coiny]">
          Manage your account and preferences
        </Text>
      </View>

      {/* Profile Card */}
      <View className="mx-6 rounded-3xl bg-gray-50 p-5">
        <View className="flex-row items-center">
          {/* Avatar */}
          <View className="h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-2xl font-bold text-blue-600">
              {displayName.charAt(0)}
            </Text>
          </View>

          {/* User Information */}
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-gray-900">
              {displayName}
            </Text>

            <Text className="mt-1 text-gray-500">{email}</Text>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={19} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Section */}
      <View className="mt-8 px-6">
        <Text className="mb-3 text-sm font-semibold uppercase text-gray-400">
          Account
        </Text>

        <View className="overflow-hidden rounded-2xl bg-gray-50">
          <ProfileItem
            icon="settings-outline"
            title="Account Settings"
            subtitle="Update your account details"
          />

          <ProfileItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage notification preferences"
          />
        </View>
      </View>

      {/* Support Section */}
      <View className="mt-8 px-6">
        <Text className="mb-3 text-sm font-semibold uppercase text-gray-400">
          Support
        </Text>

        <View className="overflow-hidden rounded-2xl bg-gray-50">
          <ProfileItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with the app"
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="mx-6 mt-8 flex-row items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-4"
        activeOpacity={0.7}
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />

        <Text className="ml-2 font-semibold text-red-600">Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
