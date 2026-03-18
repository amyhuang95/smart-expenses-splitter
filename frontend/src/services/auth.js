import { request } from "./api.js";

/**
 * Auth service for handling user authentication and session management.
 */

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
