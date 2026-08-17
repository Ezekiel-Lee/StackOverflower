import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  NextOrObserver,
  onAuthStateChanged,
  signOut,
  updateProfile,
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

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const authListener = (callback: NextOrObserver<User>) =>
  onAuthStateChanged(auth, callback);

export const logOut = () => signOut(auth);
