import { auth } from "./firebase/firebase";

const API_URL = "http://localhost:8000";

export async function syncUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated Firebase user");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to sync user");
  }

  return response.json();
}

export async function getDevices() {
  const response = await fetch(`${API_URL}/devices`);

  if (!response.ok) {
    throw new Error("Failed to fetch devices");
  }

  return response.json();
}
