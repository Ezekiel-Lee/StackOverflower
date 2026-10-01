import { auth } from "./firebase/firebase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

export async function syncUser() {
  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to sync user");
  }

  return response.json();
}

export async function getDevices() {
  const response = await fetch(`${API_URL}/devices`, {
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch devices");
  }

  return response.json();
}

export async function getData(id: string) {
  const response = await fetch(`${API_URL}/devices/${id}/data`, {
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  return response.json();
}

export async function postSensorData(
  deviceId: string,
  reading: {
    sensor_type: string;
    value: number;
    unit: string;
    recorded_at: string;
  },
) {
  const response = await fetch(`${API_URL}/devices/${deviceId}/data`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(reading),
  });

  if (!response.ok) {
    throw new Error("Failed to post sensor data");
  }

  return response.json();
}

export async function registerDevice(payload: {
  name: string;
  vendor?: string;
}) {
  const response = await fetch(`${API_URL}/devices`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to register device");
  }

  return response.json();
}

export async function deleteDevice(id: string) {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete device");
  }
}
