import { Pressable, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";

type AppleSignInButtonProps = {
  onPress: () => void;
};

export default function AppleSignInButton({ onPress }: AppleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className=" px-4 py-4 flex-row items-center justify-center rounded-lg bg-black"
    >
      <AntDesign name="apple" size={20} color="white" />

      <Text className="ml-3 text-base font-medium text-white">
        Sign In with Apple
      </Text>
    </Pressable>
  );
}
