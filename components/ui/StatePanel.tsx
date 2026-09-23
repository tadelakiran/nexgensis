import type { ReactNode } from "react";

import { ApiError } from "@/lib/axios";
import { Button } from "./Button";
import { InboxIcon, SpinnerIcon, WarningIcon } from "./icons";

/**
 * The three "nothing normal to show" states, kept together so they stay visually
 * consistent wherever they appear (list, detail page, empty search).
 */

interface StatePanelProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
}

function StatePanel({ icon, title, description, action, tone = "neutral" }: StatePanelProps) {
  const iconClasses =
    tone === "danger"
      ? "bg-rose-50 text-rose-600 ring-rose-100"
      : "bg-slate-50 text-slate-400 ring-slate-100";

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className={[
          "mb-4 flex size-14 items-center justify-center rounded-2xl ring-1",
          iconClasses,
        ].join(" ")}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? (
        <div className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">{description}</div>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <StatePanel
      icon={<InboxIcon className="size-6" />}
      title={title}
      description={description}
      action={action}
    />
  );
}

interface ErrorStateProps {
  error: ApiError;
  onRetry: () => void;
  /** Extra action, e.g. "Clear filters" when a filter caused the failure. */
  extraAction?: ReactNode;
  context?: string;
}

export function ErrorState({ error, onRetry, extraAction, context }: ErrorStateProps) {
  return (
    <StatePanel
      tone="danger"
      icon={<WarningIcon className="size-6" />}
      title={context ? `Could not load ${context}` : "Something went wrong"}
      description={error.message}
      action={
        <>
          {/* Retry only makes sense for failures that could plausibly succeed on a
              second attempt — not for an aborted request we cancelled on purpose. */}
          {error.canRetry ? (
            <Button onClick={onRetry} size="sm">
              Try again
            </Button>
          ) : null}
          {extraAction}
        </>
      }
    />
  );
}

export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <SpinnerIcon className="size-8 animate-spin text-brand-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
