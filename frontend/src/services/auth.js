/*
 * Frontend service functions for user authentication and session management.
 **/

async function readJsonResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Helper function to make API requests with proper error handling and JSON parsing.
async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.error || "Request failed.");
  }

  return data;
}

export async function fetchCurrentUser() {
  const data = await request("/api/users/me", {
    method: "GET",
  });

  return data?.user ?? null;
}

export async function loginUser(credentials) {
  const data = await request("/api/users/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return data.user;
}

export async function registerUser(payload) {
  const data = await request("/api/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.user;
}

export async function logoutUser() {
  await request("/api/users/logout", {
    method: "POST",
  });
}
