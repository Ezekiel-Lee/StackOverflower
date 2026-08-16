const API_URL = "http://localhost:8000";

export async function syncUser(idToken: string) {
  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to sync user");
  }

  return response.json();
}
