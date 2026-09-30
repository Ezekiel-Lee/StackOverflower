import { Pressable, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";

type GoogleSignInButtonProps = {
  onPress: () => void;
};

export default function GoogleSignInButton({
  onPress,
}: GoogleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className=" px-4 py-4 flex-row items-center justify-center rounded-lg border border-gray-300 bg-blue-500"
    >
      <AntDesign name="google" size={20} color="#FFA500" />

      <Text className="ml-3 text-base font-medium text-white">
        Sign In with Google
      </Text>
    </Pressable>
  );
}
