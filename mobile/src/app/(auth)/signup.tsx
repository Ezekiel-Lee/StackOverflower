import { View, Text, TextInput, Pressable, Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleSignInButton from "@/components/buttons/googleSignInButton";
import AppleSignInButton from "@/components/buttons/appleSignInButton";
import { Link } from "expo-router";

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
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SignUpForm) => {
    console.log(data);
  };

  const onGoogleSignIn = () => {
    console.log("Sign in with google");
  };

  const onAppleSignIn = () => {
    console.log("Sign in with apple");
  };

  return (
    <SafeAreaView className="flex-1 px-12 pt-20">
      <Image
        source={require("@/assets/images/logo.png")}
        className="mx-auto h-44 w-44"
      />

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
              autoCapitalize="words"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
      <View className="mb-4">
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

      {/* Confirm Password */}
      <View className="mb-6">
        <Text className="mb-2 text-sm font-medium">Confirm Password</Text>

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-4 py-3 focus:border-black"
              placeholder="Confirm your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
        className="rounded-full bg-[#787171] py-4"
      >
        <Text className="text-center font-semibold text-white">Register</Text>
      </Pressable>

      {/* Sign In */}
      <Text className="pt-4 text-center font-bold">
        Already have an account?
        <Link href="/(auth)/login">
          <Text className="text-[#2563EB] underline"> Sign in</Text>
        </Link>
      </Text>

      {/* Social Sign In */}
      <View className="flex-row justify-center gap-5 pt-12">
        <GoogleSignInButton onPress={onGoogleSignIn} />
        <AppleSignInButton onPress={onAppleSignIn} />
      </View>
    </SafeAreaView>
  );
}
