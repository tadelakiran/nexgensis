import { LoginForm } from "@/features/auth/components/LoginForm";
import { safeRedirectPath } from "@/lib/safe-redirect";

export const metadata = {
  title: "Sign in",
};

/**
 * `searchParams` is a Promise in Next.js 16, so it is awaited here.
 *
 * Reading it on the server (rather than with `useSearchParams`) means the login
 * form receives `nextPath` as a plain prop: no Suspense boundary needed, and the
 * destination is validated before it ever reaches the client, so `?next=` cannot
 * be used as an open redirect.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.next) ? params.next[0] : params.next;

  return <LoginForm nextPath={safeRedirectPath(requested)} />;
}
