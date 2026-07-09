import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import Welcome from "./app/components/Pages/welcome.tsx";
import Signup from "./app/components/Pages/signup.tsx";
import Login from "./app/components/Pages/login.tsx";
import OauthCallback from "./app/components/Pages/oauth-callback.tsx";
import "./styles/index.css";
import axios from "axios";

// Configure global Axios settings
axios.defaults.baseURL = "http://127.0.0.1:8000";

const SESSION_KEY = "figjam_session";

function isAuthenticated() {
  return !!localStorage.getItem(SESSION_KEY);
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

import DashboardPage from "./pages/DashboardPage";
import BoardPage from "./pages/BoardPage";

createRoot(document.getElementById("root")!).render(
  <>
    <Toaster position="top-right" richColors />
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<ProtectedApp><DashboardPage /></ProtectedApp>} />
      <Route path="/board/:board_id" element={<ProtectedApp><BoardPage /></ProtectedApp>} />
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
  </>
);
