import axios from "axios";

export const TOKEN_STORAGE_KEY = "investment_db_token";
export const UNAUTHORIZED_EVENT = "investment-db:unauthorized";

// Set VITE_API_URL in frontend/.env (see .env.example) to point at another backend.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login/");

    // An expired or revoked token: tell the app to sign the user out.
    if (error.response?.status === 401 && !isLoginRequest) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
