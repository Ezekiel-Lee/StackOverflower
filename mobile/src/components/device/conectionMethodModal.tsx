import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ConnectionMethod = "health-connect" | "ble";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: ConnectionMethod) => void;
};

export function ConnectionMethodModal({ visible, onClose, onSelect }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center bg-black/50 px-6">
        <View className="rounded-2xl bg-white p-6">
          <Text className="mb-2 text-xl font-bold">Add Device</Text>

          <Text className="mb-6 text-gray-500">
            Choose how you want to connect your wearable.
          </Text>

          <Pressable
            onPress={() => onSelect("health-connect")}
            className="mb-3 flex-row items-center rounded-xl border border-gray-200 p-4"
          >
            <Ionicons name="heart-outline" size={26} color="#16a34a" />

            <View className="ml-4 flex-1">
              <Text className="font-semibold">Health Connect</Text>
              <Text className="text-sm text-gray-500">
                Sync health data from Android
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => onSelect("ble")}
            className="flex-row items-center rounded-xl border border-gray-200 p-4"
          >
            <Ionicons name="bluetooth-outline" size={26} color="#2563eb" />

            <View className="ml-4 flex-1">
              <Text className="font-semibold">Bluetooth (BLE)</Text>
              <Text className="text-sm text-gray-500">
                Connect directly to a wearable
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={onClose} className="mt-6 py-2">
            <Text className="text-center text-gray-500">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
