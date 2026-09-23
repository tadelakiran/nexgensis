import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ProductsOverlayProvider } from "@/components/providers/ProductsOverlayProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nexgensis · Product Admin",
    template: "%s · Nexgensis",
  },
  description:
    "Admin dashboard for browsing, searching and managing the DummyJSON product catalogue. Built with Next.js, React, Tailwind CSS and Axios.",
};

/**
 * Providers are mounted here, once, so every route shares one auth session, one
 * toast stack and one local-change overlay.
 *
 * Order matters: `AuthProvider` reports an expired session with a toast, so it must
 * sit inside `ToastProvider`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-slate-900 antialiased">
        <ToastProvider>
          <AuthProvider>
            <ProductsOverlayProvider>{children}</ProductsOverlayProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
