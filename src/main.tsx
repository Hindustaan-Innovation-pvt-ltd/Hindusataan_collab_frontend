import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import App from "./app/App.tsx";
import Signup from "./app/components/Pages/signup.tsx";
import Login from "./app/components/Pages/login.tsx";
import "./styles/index.css";

const SESSION_KEY = "figjam_session";

function isAuthenticated() {
  return !!localStorage.getItem(SESSION_KEY);
}

function ProtectedApp() {
  if (!isAuthenticated()) {
    return <Navigate to="/signup" replace />;
  }
  return <App />;
}

function PublicOnly({ children }: { children: ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<ProtectedApp />} />
      <Route path="/board/:boardId/:boardName?" element={<ProtectedApp />} />
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
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  </BrowserRouter>,
);
