import { auth } from "@/lib/firebase/firebase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is not configured");
}

async function authHeaders() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated Firebase user");
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function getErrorMessage(response: Response): Promise<string> {
  const body = await response.text();

  if (!body) {
    return `Request failed with status ${response.status}`;
  }

  try {
    const parsed = JSON.parse(body);
    return parsed.detail ?? parsed.message ?? body;
  } catch {
    return body;
  }
}

export async function startDeviceSession(deviceId: string): Promise<string> {
  const response = await fetch(
    `${API_URL}/devices/${encodeURIComponent(deviceId)}/sessions`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const session: { id: string } = await response.json();

  if (!session.id) {
    throw new Error("The API response did not contain a session ID");
  }

  return session.id;
}

export async function endDeviceSession(
  deviceId: string,
  sessionId: string,
  reason: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/devices/${encodeURIComponent(deviceId)}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({
        disconnect_reason: reason,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}
