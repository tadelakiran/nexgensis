"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { LoadingSpinner } from "@/components/ui/StatePanel";

/**
 * Client-side route protection.
 *
 * There is no server-side session check available to a proxy/middleware here: the
 * token lives in localStorage, which only the browser can read. So the guard waits
 * for the auth status to resolve (see `AuthProvider`) and redirects anything that
 * is not authenticated, remembering where the user was heading so login can send
 * them back.
 *
 * The alternative — mirroring the token into a cookie so a `proxy.ts` could
 * redirect before render — is discussed in the README.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    // Read the browser location directly instead of useSearchParams: this keeps
    // the current query string too, so a deep link such as
    // /products?page=3&q=phone survives the login round trip. It also avoids
    // needing a Suspense boundary above the guard.
    const target =
      typeof window === "undefined"
        ? "/products"
        : `${window.location.pathname}${window.location.search}`;

    router.replace(`/login?next=${encodeURIComponent(target)}`);
  }, [status, router]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  // `status === "loading"` and the brief moment before the redirect both land
  // here: a full-page loader is shown, so protected content never flashes.
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <LoadingSpinner
        label={status === "loading" ? "Checking your session…" : "Redirecting to sign in…"}
      />
    </div>
  );
}
