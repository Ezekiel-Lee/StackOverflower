import { auth } from "@/lib/firebase/firebase";

const API_URL = process.env.EXPO_PUBLIC_API_URL; // matches src/lib/api.ts

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated Firebase user");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function startDeviceSession(deviceId: string): Promise<string> {
  const response = await fetch(`${API_URL}/devices/${deviceId}/sessions`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  const session = await response.json();
  return session.id;
}

export async function endDeviceSession(
  deviceId: string,
  sessionId: string,
  reason: string,
) {
  await fetch(`${API_URL}/devices/${deviceId}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ disconnect_reason: reason }),
  });
}
