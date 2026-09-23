/**
 * Types that belong to the auth feature's own surface.
 *
 * API contract types (the request and response shapes DummyJSON defines) live in
 * `@/types/api`, because they describe an external system rather than this
 * feature's UI.
 */

/**
 * - `loading`  — we do not know yet; the session has not been read from storage.
 * - `authenticated` / `unauthenticated` — resolved.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
