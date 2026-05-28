const BASE_URL = (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_URL) || import.meta.env.VITE_SERVER_DOMAIN || "https://buildathon-ngo.onrender.com";

import { authHeaders, getToken } from "./session";

// Helper to normalize URL and prevent issues like double slashes (e.g. if BASE_URL ends with / and path starts with /)
const getUrl = (path) => {
  const base = BASE_URL.trim().replace(/\/$/, "");
  const cleanPath = path.trim().replace(/^\//, "");
  return `${base}/${cleanPath}`;
};

// Helper: parse response and throw a descriptive error if not ok
async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return null;
  }
  if (!res.ok) {
    // Include field-level validation errors if present
    const fieldErrors = data.errors
      ? Object.values(data.errors).flat().join(", ")
      : null;
    throw new Error(fieldErrors || data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  post: async (path, body) => {
    const res = await fetch(getUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  authPost: async (path, body, method = "POST") => {
    const res = await fetch(getUrl(path), {
      method,
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  get: async (path) => {
    const res = await fetch(getUrl(path), {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  delete: async (path) => {
    const res = await fetch(getUrl(path), {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};

