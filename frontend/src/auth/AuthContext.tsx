import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import apiClient, {
  TOKEN_STORAGE_KEY,
  UNAUTHORIZED_EVENT,
} from "../api/client";

export type AuthUser = {
  username: string;
  is_staff: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** True while a saved session is being verified on first load. */
  loading: boolean;
  isStaff: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the in-memory state still resets.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => readToken() !== null);

  // Restore a saved session.
  useEffect(() => {
    if (!readToken()) return;

    apiClient
      .get<AuthUser>("/auth/me/")
      .then((response) => setUser(response.data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // The API client reports expired or revoked tokens through this event.
  useEffect(() => {
    function handleUnauthorized() {
      clearToken();
      setUser(null);
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiClient.post<AuthUser & { token: string }>(
      "/auth/login/",
      { username, password }
    );

    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
    setUser({
      username: response.data.username,
      is_staff: response.data.is_staff,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout/");
    } catch {
      // Sign out locally even if the server cannot be reached.
    }

    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isStaff: !!user?.is_staff, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
