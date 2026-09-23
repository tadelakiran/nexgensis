"use client";

import { createContext } from "react";

import type { AuthUser, LoginCredentials } from "@/types/api";
import type { AuthStatus } from "./types";

/**
 * The auth context, deliberately in its own module.
 *
 * `useAuth` (in `./hooks/useAuth.ts`) and `AuthProvider` both need this object.
 * Keeping it here means the hook does not have to import the provider module —
 * so importing the hook pulls in no component code, and there is no import cycle
 * between the two.
 */

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  /** Resolves with the signed-in user, or throws an `ApiError` the form can show. */
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
