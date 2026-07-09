/// <reference types="vite/client" />
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const authService = {
  /**
   * Triggers the Google OAuth flow by redirecting the window to the FastAPI backend endpoint.
   * The backend will authenticate the user and redirect back to the frontend with session/JWT data
   * which can be saved/verified with MongoDB on the backend.
   */
  redirectToGoogleOAuth(): void {
    // When the backend is ready, you can redirect to the FastAPI endpoint:
    // window.location.href = `${API_URL}/auth/google`;
    console.log("Redirecting to Google OAuth via FastAPI `/auth/google`...");
    alert("Google OAuth redirect: This will redirect to the FastAPI `/auth/google` endpoint when the backend is connected.");
  },

  /**
   * Triggers the GitHub OAuth flow by redirecting the window to the FastAPI backend endpoint.
   * The backend will authenticate the user and redirect back to the frontend with session/JWT data
   * which can be saved/verified with MongoDB on the backend.
   */
  redirectToGithubOAuth(): void {
    // When the backend is ready, you can redirect to the FastAPI endpoint:
    // window.location.href = `${API_URL}/auth/github`;
    console.log("Redirecting to GitHub OAuth via FastAPI `/auth/github`...");
    alert("GitHub OAuth redirect: This will redirect to the FastAPI `/auth/github` endpoint when the backend is connected.");
  }
};
