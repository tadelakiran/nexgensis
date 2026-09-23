import { http } from "../axios";
import type { AuthUser, LoginCredentials, LoginResponse } from "../types";

/** POST /auth/login */
export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>(
    "/auth/login",
    {
      username: credentials.username,
      password: credentials.password,
      // DummyJSON needs an expiry; 60 minutes is plenty for a demo session.
      expiresInMins: credentials.expiresInMins ?? 60,
    },
    {
      // Two deliberate opt-outs for the login endpoint only:
      // - no bearer token, because there is no session yet;
      // - no global 401 handling, because a rejected login is a form error the
      //   user should see inline, not a "your session expired" redirect.
      skipAuth: true,
      skipUnauthorizedHandler: true,
    },
  );
  return data;
}

/**
 * Narrow the API response to the fields the UI actually uses, so the shape we
 * persist to localStorage stays small and predictable.
 */
export function toAuthUser(response: LoginResponse): AuthUser {
  return {
    id: response.id,
    username: response.username,
    email: response.email,
    firstName: response.firstName,
    lastName: response.lastName,
    image: response.image,
  };
}
