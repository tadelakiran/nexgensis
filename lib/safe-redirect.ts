/**
 * Validate a post-login destination taken from the URL.
 *
 * `?next=` is attacker-controllable, so it must never be able to send a user to
 * another origin. Only same-site, absolute *paths* are accepted, which rules out
 * `https://evil.example`, the protocol-relative `//evil.example`, and the
 * backslash trick `/\evil.example` that some browsers normalise into a host.
 */

const FALLBACK = "/products";

export function safeRedirectPath(candidate: string | null | undefined): string {
  if (typeof candidate !== "string") return FALLBACK;

  // Strip control characters that could smuggle in a second header/segment.
  const value = candidate.replace(/[\u0000-\u001f\u007f]/g, "").trim();

  if (!value.startsWith("/")) return FALLBACK;
  if (value.startsWith("//")) return FALLBACK;
  if (value.includes("\\")) return FALLBACK;
  if (value.includes("://")) return FALLBACK;

  return value;
}
