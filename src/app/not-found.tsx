import Link from "next/link";

import { PackageIcon } from "@/components/ui/icons";

/** Global 404 for any route that does not exist. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="animate-slide-up w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-lg shadow-slate-900/5">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-600/25">
          <PackageIcon className="size-7" />
        </div>

        <p className="text-xs font-bold tracking-widest text-brand-600 uppercase">Error 404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          We could not find the page you were looking for. It may have been moved, or the link may
          be wrong.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:brightness-110"
        >
          Back to products
        </Link>
      </div>
    </main>
  );
}
