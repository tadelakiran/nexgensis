/**
 * Generic, SSR-safe localStorage access.
 *
 * Every call is guarded twice: server-side rendering has no `window`, and
 * browsers can throw on access (Safari private mode, storage disabled by policy,
 * quota exceeded). Returning `null`/`false` instead of throwing means a blocked
 * store degrades to "no persistence" rather than a crashed page.
 */

const isAvailable = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function readStorage(key: string): string | null {
  if (!isAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  if (!isAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing else we can do; the in-memory state is still correct.
  }
}
