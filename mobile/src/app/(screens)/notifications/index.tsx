import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getNotifications, type Notification } from "@/lib/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await getNotifications();
      setNotifications(result);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-7 pt-4">
          <Text className="font-[Coiny] text-2xl text-[#005114]">
            Notifications
          </Text>

          <Pressable
            onPress={fetchNotifications}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Refresh notifications"
            className="h-10 w-10 items-center justify-center rounded-full bg-[#D7FAE0]"
          >
            <Ionicons name="refresh-outline" size={21} color="#005114" />
          </Pressable>
        </View>

        {/* Loading */}
        {loading && (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#005114" />
            <Text className="mt-3 text-sm text-gray-500">
              Loading notifications...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View className="mx-4 items-center rounded-2xl border border-red-200 bg-red-50 px-5 py-8">
            <Ionicons name="alert-circle-outline" size={32} color="#B91C1C" />

            <Text className="mt-3 text-center text-gray-800">
              Couldn't load notifications.
            </Text>

            <Text className="mt-2 text-center text-sm text-gray-500">
              {error}
            </Text>

            <Pressable
              onPress={fetchNotifications}
              className="mt-5 rounded-xl bg-[#005114] px-5 py-3"
            >
              <Text className="font-[Coiny] text-white">Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Notification List */}
        {!loading && !error && (
          <View className="mx-4 overflow-hidden rounded-2xl border border-green-200 bg-[#F3FCF5]">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <View
                  key={notification.id}
                  className={`flex-row items-start px-4 py-5 ${
                    index !== notifications.length - 1
                      ? "border-b border-green-200"
                      : ""
                  }`}
                >
                  <View className="mr-3 mt-1 h-10 w-10 items-center justify-center rounded-full bg-[#D7FAE0]">
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color="#005114"
                    />
                  </View>

                  <View className="flex-1">
                    <View className="mb-2 flex-row flex-wrap items-center">
                      <Text className="font-[Coiny] text-sm capitalize text-[#005114]">
                        {notification.severity}
                      </Text>

                      {notification.read_at == null && (
                        <View className="ml-2 rounded-full bg-green-200 px-2 py-0.5">
                          <Text className="text-xs text-green-900">Unread</Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-base leading-6 text-gray-800">
                      {notification.message}
                    </Text>

                    <Text className="mt-2 text-xs text-gray-500">
                      {Number.isNaN(new Date(notification.created_at).getTime())
                        ? notification.created_at
                        : new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center px-6 py-12">
                <Ionicons
                  name="notifications-off-outline"
                  size={36}
                  color="#6B7280"
                />

                <Text className="mt-3 font-[Coiny] text-lg text-gray-700">
                  No notifications
                </Text>

                <Text className="mt-1 text-center text-sm text-gray-500">
                  You're all caught up!
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
