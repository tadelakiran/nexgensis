import { LoadingSpinner } from "@/components/ui/StatePanel";

/**
 * Route-level loading UI.
 *
 * Next.js renders this while a segment's server work is in flight. It is the
 * coarse fallback: the products list has its own skeleton (which mirrors the real
 * row layout) and manages its own in-page loading state, so this is what covers
 * the gaps — a slow first paint, or navigation to a route with no custom loading
 * file of its own.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <LoadingSpinner label="Loading…" />
    </div>
  );
}
