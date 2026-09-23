"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { WarningIcon } from "@/components/ui/icons";

/**
 * Root error boundary.
 *
 * Catches a render or data error that escaped a page (and, importantly, a
 * *client*-side render crash, which the in-page error states cannot catch, since
 * those only describe failed requests).
 *
 * Must be a client component: Next.js needs `reset` to be callable from the
 * browser. Real errors are logged for the developer, but the user only ever sees a
 * plain sentence — an exception message is not useful to them and may leak
 * internals.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <StatePanel
          tone="danger"
          icon={<WarningIcon className="size-6" />}
          title="Something went wrong"
          description="An unexpected error interrupted this page. Trying again usually fixes a temporary problem."
          action={
            <>
              <Button onClick={reset} size="sm">
                Try again
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/products")}
              >
                Back to products
              </Button>
            </>
          }
        />
      </div>
    </div>
  );
}
