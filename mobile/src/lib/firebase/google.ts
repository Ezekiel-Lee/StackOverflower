import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { auth } from "./firebase";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (!webClientId) {
  throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured");
}

GoogleSignin.configure({
  webClientId,
});

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();

  // The user cancelled the sign-in flow.
  if (!isSuccessResponse(response)) {
    return null;
  }

  const idToken = response.data.idToken;

  if (!idToken) {
    throw new Error("Failed to get Google ID token");
  }

  const credential = GoogleAuthProvider.credential(idToken);

  // Sign in to Firebase with the Google credential.
  return signInWithCredential(auth, credential);
};
