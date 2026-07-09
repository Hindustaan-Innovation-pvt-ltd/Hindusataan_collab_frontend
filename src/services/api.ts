/// <reference types="vite/client" />
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Do not throw error here, let the backend reject if it requires auth
    // otherwise public endpoints like GET /boards/ will fail on frontend before sending.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
