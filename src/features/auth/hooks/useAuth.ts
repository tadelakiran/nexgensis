"use client";

import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "../context";

/**
 * Read the current session.
 *
 * Throws when used outside the provider rather than returning a nullable value,
 * so a misplaced call fails loudly at development time instead of producing a
 * component that silently believes nobody is signed in.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return context;
}
