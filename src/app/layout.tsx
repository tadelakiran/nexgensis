import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProductsOverlayProvider } from "@/features/products/ProductsOverlayProvider";
import { ToastProvider } from "@/components/ui/Toast";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_NAME = "Nexgensis Product Admin";
const SITE_DESCRIPTION =
  "Admin dashboard for browsing, searching and managing the DummyJSON product catalogue. Built with Next.js, React, Tailwind CSS and Axios.";

/**
 * Absolute base URL for canonical and social links.
 *
 * `metadataBase` is required before relative Open Graph paths can be resolved, and
 * Next warns on every build without it. Vercel exposes `VERCEL_URL` automatically,
 * so a deployment resolves itself; set `NEXT_PUBLIC_SITE_URL` to override it with a
 * custom domain, and local development falls back to localhost.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: {
    default: "Nexgensis · Product Admin",
    template: "%s · Nexgensis",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Nexgensis · Product Admin",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    // `summary` rather than `summary_large_image`: no raster preview image ships
    // with this project. See the README for the one-file `next/og` addition that
    // would upgrade this.
    card: "summary",
    title: "Nexgensis · Product Admin",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
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
