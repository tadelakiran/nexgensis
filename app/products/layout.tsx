import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata = {
  title: "Products",
};

/**
 * Everything under /products is protected here, once.
 *
 * Putting the guard in a layout rather than in each page means the product list
 * and every product detail page are covered by the same rule, and a new nested
 * route cannot accidentally be added unprotected.
 */
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col">
        <AppHeader />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200/70 py-6">
          <p className="mx-auto max-w-7xl px-4 text-center text-xs leading-relaxed text-slate-400 sm:px-6">
            Data from the free DummyJSON API. It does not persist writes, so add, edit and delete
            changes are kept in this browser and can be reset from the header.
          </p>
        </footer>
      </div>
    </AuthGuard>
  );
}
