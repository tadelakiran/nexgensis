import { STORAGE_KEYS } from "./constants";
import { readStorage, removeStorage, writeStorage } from "./local-storage";
import type { AuthUser } from "./types";

/**
 * The auth session as it is persisted between page loads.
 *
 * The token lives in localStorage because every API call is made from the
 * browser, and this module deliberately has no React or Next.js imports so both
 * the Axios layer and the auth provider can use it.
 *
 * A production app handing out real, long-lived credentials would keep the token
 * in an httpOnly cookie so JavaScript could not read it (see README >
 * "Known limitations and what I would do next").
 */

export function getStoredToken(): string | null {
  const token = readStorage(STORAGE_KEYS.token);
  return token && token.trim() !== "" ? token : null;
}

export function getStoredUser(): AuthUser | null {
  const raw = readStorage(STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw) as unknown;
    // Guard against a hand-edited or stale entry: `id` and `username` are the
    // only fields the UI depends on, so anything else missing is tolerated.
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as AuthUser).id !== "number" ||
      typeof (parsed as AuthUser).username !== "string"
    ) {
      return null;
    }
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: AuthUser): void {
  writeStorage(STORAGE_KEYS.token, token);
  writeStorage(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearStoredSession(): void {
  removeStorage(STORAGE_KEYS.token);
  removeStorage(STORAGE_KEYS.user);
}
