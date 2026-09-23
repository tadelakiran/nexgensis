"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  CheckCircleIcon,
  CloseIcon,
  InfoIcon,
  WarningIcon,
} from "@/components/ui/icons";

/**
 * Minimal toast system (no dependency).
 *
 * Used for the feedback that has no natural home in the page layout: "product
 * added", "session expired", "delete failed". Toasts never block the page, so the
 * UI stays usable even when a request fails.
 */

export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface PushToastInput {
  tone?: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  pushToast: (input: PushToastInput) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 4;

const TONE_ICON: Record<ToastTone, ComponentType<{ className?: string }>> = {
  success: CheckCircleIcon,
  error: WarningIcon,
  info: InfoIcon,
};

const TONE_ACCENT: Record<ToastTone, string> = {
  success: "text-emerald-600",
  error: "text-rose-600",
  info: "text-brand-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>> | null>(null);

  if (timersRef.current === null) {
    timersRef.current = new Map();
  }

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current?.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current?.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ tone = "info", title, description, durationMs = DEFAULT_DURATION_MS }: PushToastInput) => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;

      setToasts((current) => [
        // Cap the stack so a burst of errors cannot fill the viewport; the
        // oldest message is dropped first.
        ...current.slice(-(MAX_VISIBLE_TOASTS - 1)),
        { id, tone, title, description },
      ]);

      const timer = setTimeout(() => dismissToast(id), durationMs);
      timersRef.current?.set(id, timer);
    },
    [dismissToast],
  );

  // Clear pending timers on unmount so a dismissed provider cannot fire setState.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers?.forEach((timer) => clearTimeout(timer));
      timers?.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ pushToast, dismissToast }),
    [pushToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex flex-col items-center gap-3 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((toast) => {
          const Icon = TONE_ICON[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className="animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${TONE_ACCENT[toast.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-sm text-slate-600">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="-m-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>.");
  }
  return context;
}
