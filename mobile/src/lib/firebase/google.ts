import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { auth } from "./firebase";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();

  const response = await GoogleSignin.signIn();

  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error("Failed to get Google ID token");
  }

  const credential = GoogleAuthProvider.credential(idToken);

  return signInWithCredential(auth, credential);
};
