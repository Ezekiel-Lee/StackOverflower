import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  NextOrObserver,
  onAuthStateChanged,
  signOut,
  updateProfile,
  updatePassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { auth } from "./firebase";

// Configure Google Sign-In once.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
) => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  await updateProfile(credential.user, {
    displayName,
  });

  return credential;
};

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();

  // The user cancelled the sign-in process.
  if (!isSuccessResponse(response)) {
    return null;
  }

  const idToken = response.data.idToken;

  if (!idToken) {
    throw new Error(
      "Google ID token is missing. Check your Google OAuth configuration.",
    );
  }

  const credential = GoogleAuthProvider.credential(idToken);

  return signInWithCredential(auth, credential);
};

export const authListener = (callback: NextOrObserver<User>) => {
  return onAuthStateChanged(auth, callback);
};

export const logOut = () => {
  return signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const updateDisplayName = async (displayName: string) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user.");
  }

  await updateProfile(user, {
    displayName,
  });

  return user;
};

export const changePassword = async (password: string) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user.");
  }

  await updatePassword(user, password);
};
