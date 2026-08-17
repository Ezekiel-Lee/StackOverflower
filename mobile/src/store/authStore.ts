import { create } from "zustand";
import { User } from "firebase/auth";
import { authListener, logOut } from "@/lib/firebase/auth";
import { syncUser } from "@/lib/api";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  initializeAuth: () => () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  initializeAuth: () => {
    const unsubscribe = authListener(async (user) => {
      if (user) {
        try {
          await syncUser();
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      }

      set({
        user,
        loading: false,
        initialized: true,
      });
    });

    return unsubscribe;
  },

  logout: async () => {
    await logOut();
  },
}));
