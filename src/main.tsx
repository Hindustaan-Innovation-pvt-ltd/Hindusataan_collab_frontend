import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import Welcome from "./app/components/Pages/welcome.tsx";
import Signup from "./app/components/Pages/signup.tsx";
import Login from "./app/components/Pages/login.tsx";
import OauthCallback from "./app/components/Pages/oauth-callback.tsx";
import ProfilePage from "./app/components/Pages/ProfilePage.tsx";
import SettingsPage from "./app/components/Pages/SettingsPage.tsx";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { WorkspaceThemeProvider } from "./contexts/WorkspaceThemeContext.tsx";
import "./styles/index.css";
import axios from "axios";

// Configure global Axios settings
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://apijam.allindiahub.com");

const SESSION_KEY = "HIXCanvas_session";

function checkSession() {
  try {
    const isEphemeral = localStorage.getItem("figjam_ephemeral") === "true";
    const isSessionActive = sessionStorage.getItem("figjam_session_active") === "true";
    
    if (isEphemeral && !isSessionActive) {
      localStorage.removeItem("token");
      localStorage.removeItem("figjam_token");
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("figjam_ephemeral");
    }
  } catch (e) {
    console.warn("Storage access is restricted:", e);
  }
}

// Check session status on initial application load
checkSession();

function isAuthenticated() {
  try {
    return !!localStorage.getItem(SESSION_KEY);
  } catch (e) {
    return false;
  }
}

function ProtectedApp({ children }: { children?: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}


createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <WorkspaceThemeProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedApp><App /></ProtectedApp>} />
          <Route path="/board/:boardId/:boardName?" element={<ProtectedApp><App /></ProtectedApp>} />
          <Route path="/profile" element={<ProtectedApp><ProfilePage /></ProtectedApp>} />
          <Route path="/settings" element={<ProtectedApp><SettingsPage /></ProtectedApp>} />
          <Route
            path="/welcome"
            element={
              <PublicOnly>
                <Welcome />
              </PublicOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnly>
                <Signup />
              </PublicOnly>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route path="/oauth-callback" element={<OauthCallback />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </BrowserRouter>
    </WorkspaceThemeProvider>
  </ThemeProvider>
);

