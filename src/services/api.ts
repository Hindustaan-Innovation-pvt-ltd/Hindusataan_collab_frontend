/// <reference types="vite/client" />
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://apijam.allindiahub.com");

// ── Axios instance (used by collaborationService, boardService, etc.) ──────
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("HIXCanvas_token") || localStorage.getItem("token");

    if (config.url && config.url.includes("/api/collaboration")) {
      if (!token) {
        return Promise.reject(new Error("Please log in first to use collaboration features."));
      }
    }

    if (token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("HIXCanvas_token");
      localStorage.removeItem("token");
      localStorage.removeItem("HIXCanvas_session");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ── fetchWithAuth helper (used by new integration-branch services) ──────────
/**
 * A helper function to make fetch requests with the Authorization header.
 * Checks both "HIXCanvas_token" and "token" keys in localStorage.
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("HIXCanvas_token") || localStorage.getItem("token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.error("Unauthorized request. Token might be invalid or expired.");
    localStorage.removeItem("token");
    localStorage.removeItem("HIXCanvas_token");
    localStorage.removeItem("HIXCanvas_session");
    window.location.href = "/login";
  }

  return response;
}
