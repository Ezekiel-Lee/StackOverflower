import { View, Text, TextInput, Pressable, Image, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleSignInButton from "@/components/buttons/googleSignInButton";
import AppleSignInButton from "@/components/buttons/appleSignInButton";
import { Link } from "expo-router";
import { signInWithEmail } from "@/lib/firebase/auth";

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function Login() {
  const {
    control,
    handleSubmit,
    formState: { errors },
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
      Alert.alert("Success", "Logged In");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to Login");
    }
  };

  const onGoogleSignIn = () => {
    console.log("Sign in with google");
  };

  const onAppleSignIn = () => {
    console.log("Sign in with apple");
  };

  return (
    <SafeAreaView className=" flex-1 pt-20 px-12">
      <Image
        source={require("@/assets/images/logo.png")}
        className="h-44 w-44 mx-auto"
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
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
              className="rounded-lg border border-gray-300 px-4 py-3 focus:border-black"
              placeholder="Enter your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.password && (
          <Text className="mt-1 text-sm text-red-500">
            {errors.password.message}
          </Text>
        )}
      </View>

      {/* Buttons */}
      <Pressable
        onPress={handleSubmit(onSubmit)}
        className="rounded-full bg-[#787171] py-4"
      >
        <Text className="text-center font-semibold text-white">Sign In</Text>
      </Pressable>
      <Text className="font-bold pt-4 text-center">
        {" "}
        Don't have an account?{" "}
        <Link href="/(auth)/signup">
          {" "}
          <Text className=" text-[#2563EB]  underline "> Sign up</Text>
        </Link>
      </Text>
      <View className="gap-5 pt-12 flex-row justify-center ">
        <GoogleSignInButton onPress={onGoogleSignIn} />
        <AppleSignInButton onPress={onAppleSignIn} />
      </View>
    </SafeAreaView>
  );
}
