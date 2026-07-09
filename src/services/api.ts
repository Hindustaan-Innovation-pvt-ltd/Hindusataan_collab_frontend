const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * A helper function to make fetch requests with the Authorization header.
 * Assumes the token is stored in localStorage under the key 'token'.
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
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
    localStorage.removeItem("figjam_session");
    window.location.href = "/login";
  }

  return response;
}
