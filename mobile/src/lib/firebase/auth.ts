import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  NextOrObserver,
  onAuthStateChanged,
  signOut,
  updateProfile,
  updatePassword,
} from "firebase/auth";

import { auth } from "./firebase";

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
