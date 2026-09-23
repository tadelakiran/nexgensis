"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { displayNameOf, useAuth } from "@/components/providers/AuthProvider";
import { useProductsOverlay } from "@/components/providers/ProductsOverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { LogOutIcon, PackageIcon, RefreshIcon } from "@/components/ui/icons";

/**
 * Top navigation.
 *
 * Also the home of the "local changes" indicator: because DummyJSON discards
 * writes, the header is the honest place to say how many rows exist only in this
 * browser, and to offer a reset.
 */

function UserAvatar({ name, image }: { name: string; image?: string }) {
  const [hasFailed, setHasFailed] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (!image || hasFailed) {
    return (
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-xs font-bold text-white"
      >
        {initials || "?"}
      </span>
    );
  }

  return (
    <span className="relative size-9 overflow-hidden rounded-full ring-2 ring-white">
      <Image
        src={image}
        alt=""
        fill
        sizes="36px"
        className="object-cover"
        onError={() => setHasFailed(true)}
      />
    </span>
  );
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const { changeCount, discardChanges } = useProductsOverlay();
  const { pushToast } = useToast();

  const name = displayNameOf(user);

  const handleLogout = () => {
    // No manual navigation: <AuthGuard> redirects as soon as the status flips,
    // so there is exactly one code path that decides where a signed-out user goes.
    logout();
    pushToast({ tone: "info", title: "Signed out", description: "See you next time." });
  };

  const handleDiscard = () => {
    discardChanges();
    pushToast({
      tone: "info",
      title: "Local changes discarded",
      description: "The catalogue is back to the API's version.",
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/products"
          className="flex items-center gap-3 rounded-xl py-1 transition hover:opacity-90"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/25">
            <PackageIcon className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-slate-900">
              Nexgensis
            </span>
            <span className="block text-xs text-slate-500">Product Admin</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {changeCount > 0 ? (
            <div className="hidden items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200 ring-inset sm:flex">
              <span>
                {changeCount} local {changeCount === 1 ? "change" : "changes"}
              </span>
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                <RefreshIcon className="size-3.5" />
                Reset
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2.5 rounded-xl py-1 pr-1 pl-1 sm:pl-2">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold text-slate-800">{name}</span>
              <span className="block text-xs text-slate-500">
                {user?.email ?? "Signed in"}
              </span>
            </span>
            <UserAvatar name={name} image={user?.image} />
          </div>

          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOutIcon className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
