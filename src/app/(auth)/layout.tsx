import type { ReactNode } from "react";

import { CheckCircleIcon, PackageIcon } from "@/components/ui/icons";

export const metadata = {
  title: "Sign in",
};

/**
 * The auth route group's shell.
 *
 * A route group — `(auth)` — organises these routes without adding a segment to
 * the URL, so the sign-in page is still `/login`. The brand panel and the centred
 * column live here rather than in the form, which means a future
 * `(auth)/forgot-password/page.tsx` gets the same shell for free.
 *
 * This group is intentionally *not* behind the auth guard: you cannot sign in
 * from a page that requires you to be signed in.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — decorative, hidden on small screens where space is precious. */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-16 size-80 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-10 size-72 rounded-full bg-accent-400/20 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <PackageIcon className="size-6" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">Nexgensis</p>
            <p className="text-xs text-white/70">Product Admin</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="text-4xl leading-tight font-bold tracking-tight">
            Manage your catalogue from one clean dashboard.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Browse, search, filter and edit products from the DummyJSON catalogue. Every filter
            lives in the URL, so any view can be shared as a link.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/85">
            {[
              "Server-side pagination, search and sorting",
              "Add, edit and delete with a local change overlay",
              "Loading, empty and error states everywhere",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircleIcon className="size-4 shrink-0 text-white/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          Built with Next.js, React, Tailwind CSS and Axios.
        </p>
      </aside>

      {/* Form column */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-600/25">
              <PackageIcon className="size-6" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">Nexgensis</p>
              <p className="text-xs text-slate-500">Product Admin</p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
