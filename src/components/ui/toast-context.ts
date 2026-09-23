"use client";

import { createContext } from "react";

/**
 * The toast context, in its own module so `useToast` does not have to import the
 * provider component.
 */

export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

export interface PushToastInput {
  tone?: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

export interface ToastContextValue {
  pushToast: (input: PushToastInput) => void;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
