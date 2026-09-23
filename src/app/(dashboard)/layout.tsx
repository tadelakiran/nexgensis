import type { ReactNode } from "react";

import { AppFooter } from "@/components/shared/AppFooter";
import { AppHeader } from "@/components/shared/AppHeader";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

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

        <AppFooter />
      </div>
    </AuthGuard>
  );
}
