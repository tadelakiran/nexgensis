"use client";

import { useContext } from "react";

import { ToastContext, type ToastContextValue } from "@/components/ui/toast-context";

/**
 * Global hook for pushing and dismissing toasts.
 *
 * The context object lives in `components/ui/toast-context.ts` so this hook does
 * not import the provider component.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>.");
  }
  return context;
}
