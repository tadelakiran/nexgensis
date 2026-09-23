import type { AuthUser } from "@/types/api";

/**
 * A display name for the signed-in user, with fallbacks.
 *
 * `user` can be `null` when a token was restored but the stored profile was
 * missing or unreadable — the session is still valid, so the header needs
 * something sensible to show rather than crashing on `user.firstName`.
 */
export function displayNameOf(user: AuthUser | null): string {
  if (!user) return "Signed in";
  const full = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return full || user.username;
}
