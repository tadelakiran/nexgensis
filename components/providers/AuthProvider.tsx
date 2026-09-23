"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { loginRequest, toAuthUser } from "@/lib/api/auth";
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  setStoredSession,
} from "@/lib/auth-storage";
import { setUnauthorizedHandler } from "@/lib/axios";
import type { AuthUser, LoginCredentials } from "@/lib/types";

/**
 * The single source of truth for "who is signed in".
 *
 * `status` starts as "loading" rather than "unauthenticated" on purpose. The
 * session lives in localStorage, which the server cannot read, so we do not know
 * the answer until after hydration. Treating "loading" as "not signed in" would
 * bounce a signed-in user to the login screen on every refresh.
 *
 * This is also where the Axios layer's "token is dead" signal is wired up: the
 * network module stays free of React imports and simply calls the handler we
 * register here.
 */

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { pushToast } = useToast();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /*
   * Rehydrate the session once, on the client.
   *
   * This is a deliberate exception to the `react-hooks/set-state-in-effect` rule,
   * and the only alternative is worse: reading localStorage during render would
   * make the client's first paint disagree with the server's HTML (a hydration
   * mismatch), because the server cannot see browser storage at all. Reading it in
   * an effect and starting from `status: "loading"` is the safe order — no
   * protected content is ever rendered for a user who is not signed in.
   */
  /* eslint-disable react-hooks/set-state-in-effect -- client-only storage read; see note above */
  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setToken(storedToken);
      setUser(getStoredUser());
      setStatus("authenticated");
    } else {
      clearStoredSession();
      setStatus("unauthenticated");
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const logout = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
    // No navigation here on purpose: <AuthGuard> owns redirects, so there is
    // exactly one place that decides where an unauthenticated user goes.
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    // Errors are intentionally not caught: the login form needs the ApiError
    // (with DummyJSON's "Invalid credentials" message) to render inline.
    const response = await loginRequest(credentials);
    const nextUser = toAuthUser(response);

    setStoredSession(response.accessToken, nextUser);
    setToken(response.accessToken);
    setUser(nextUser);
    setStatus("authenticated");

    return nextUser;
  }, []);

  /* Centralised handling of an expired/revoked token (HTTP 401). */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
      pushToast({
        tone: "error",
        title: "Session expired",
        description: "Your session is no longer valid. Please sign in again.",
      });
    });

    return () => setUnauthorizedHandler(null);
  }, [pushToast]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, login, logout }),
    [status, user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return context;
}

/** Convenience: the name to greet the user with, with sensible fallbacks. */
export function displayNameOf(user: AuthUser | null): string {
  if (!user) return "Signed in";
  const full = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return full || user.username;
}
