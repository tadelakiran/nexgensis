import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { getStoredToken } from "@/features/auth/lib/auth-storage";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./constants";

/**
 * The one and only Axios instance used by the app.
 *
 * Everything network-related funnels through here so that two cross-cutting
 * concerns live in exactly one place:
 *
 *   1. Auth  — the request interceptor attaches `Authorization: Bearer <token>`
 *              to every outgoing request, so no API module ever has to think
 *              about tokens.
 *   2. Errors — the response interceptor converts every failure into a single
 *              `ApiError` type, and decides centrally what an HTTP 401 means.
 *
 * The public API of this module is `http` (the instance), `ApiError`,
 * `toApiError` and `isCanceled`. UI code only ever deals with `ApiError`.
 */

/* ------------------------------------------------------------------ *
 * Per-request flags
 * ------------------------------------------------------------------ */

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Send this request without the bearer token (used by `/auth/login`). */
    skipAuth?: boolean;
    /**
     * Do not run the global "session expired" side effect for a 401 on this
     * request. Needed by the login call, where a rejected credential is an
     * ordinary form validation error rather than a dead session.
     */
    skipUnauthorizedHandler?: boolean;
  }
}

/* ------------------------------------------------------------------ *
 * A single error type for the whole app
 * ------------------------------------------------------------------ */

export type ApiErrorKind =
  | "canceled" // we aborted it on purpose (stale search, unmount)
  | "timeout"
  | "network"
  | "client" // 4xx
  | "server" // 5xx
  | "unknown";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Raw server message/body, kept for debugging without leaking it to users. */
  readonly detail: unknown;

  constructor(
    message: string,
    options: {
      kind: ApiErrorKind;
      status?: number | null;
      detail?: unknown;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status ?? null;
    this.detail = options.detail;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }

  /** Aborted-by-us errors are expected; callers should silently drop them. */
  get isCanceled(): boolean {
    return this.kind === "canceled";
  }

  /** Whether offering a Retry button makes sense for this failure. */
  get canRetry(): boolean {
    return this.kind !== "canceled";
  }
}

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

/** Pull the human-readable message out of a DummyJSON error body, if present. */
function extractServerMessage(data: unknown): string | null {
  if (typeof data === "string" && data.trim() !== "") return data.trim();
  if (typeof data === "object" && data !== null) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim() !== "") return message.trim();
  }
  return null;
}

function statusFallbackMessage(status: number): string {
  if (status === 400) return "The request was rejected. Please check the values and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "We could not find what you were looking for.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The server had a problem. Please try again in a moment.";
  return "Something went wrong. Please try again.";
}

/**
 * Normalise anything that can be thrown by Axios into an `ApiError`.
 *
 * Keeping this as a pure function means the same logic can be reused by the
 * response interceptor and by any code holding a raw error.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError("Request superseded", { kind: "canceled", cause: error });
  }

  if (error instanceof AxiosError) {
    // An AbortController abort arrives as CanceledError, but check the signal
    // too so an aborted request is never surfaced to the user as a failure.
    if (error.code === "ERR_CANCELED" || error.config?.signal?.aborted) {
      return new ApiError("Request superseded", { kind: "canceled", cause: error });
    }

    if (error.code && TIMEOUT_CODES.has(error.code)) {
      return new ApiError("The request took too long. Check your connection and try again.", {
        kind: "timeout",
        cause: error,
      });
    }

    if (!error.response) {
      return new ApiError("Could not reach the server. Check your internet connection.", {
        kind: "network",
        cause: error,
      });
    }

    const { status, data } = error.response;
    const serverMessage = extractServerMessage(data);
    const kind: ApiErrorKind = status >= 500 ? "server" : "client";

    return new ApiError(serverMessage ?? statusFallbackMessage(status), {
      kind,
      status,
      detail: data,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message, { kind: "unknown", cause: error });
  }

  return new ApiError("An unexpected error occurred.", { kind: "unknown", detail: error });
}

export function isCanceled(error: unknown): boolean {
  return axios.isCancel(error) || (error instanceof ApiError && error.isCanceled);
}

/* ------------------------------------------------------------------ *
 * The instance
 * ------------------------------------------------------------------ */

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Without a timeout a hanging request would spin forever and the user would
  // never get the Retry affordance.
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = getStoredToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

/**
 * How the auth layer subscribes to "the token is dead" without this module
 * needing to import React, Next's router, or the auth context — which would
 * create a circular dependency between the network layer and the UI layer.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    const apiError = toApiError(error);

    // Central policy: a 401 on an authenticated request means the stored token
    // is no longer accepted by the API, so we end the session once, here.
    if (apiError.status === 401 && !(error as AxiosError).config?.skipUnauthorizedHandler) {
      onUnauthorized?.();
    }

    return Promise.reject(apiError);
  },
);
