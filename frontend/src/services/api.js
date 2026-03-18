/**
 * API utility function for making requests to the backend.
 *
 */

async function readJsonResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function request(path, options = {}) {
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
