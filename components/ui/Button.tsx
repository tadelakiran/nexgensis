import type { ButtonHTMLAttributes } from "react";

import { SpinnerIcon } from "./icons";

/**
 * Button with variants.
 *
 * `buttonClasses` is exported separately so a Next `<Link>` can look like a button
 * without nesting an anchor inside a button (which would be invalid HTML and break
 * keyboard and screen-reader behaviour).
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/30 hover:brightness-110",
  secondary:
    "bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/25 hover:brightness-110",
  success: "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return [BASE, VARIANTS[variant], SIZES[size], extra].filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks further clicks. */
  isLoading?: boolean;
  /** Label swapped in while loading, e.g. "Saving…". */
  loadingText?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    // `disabled` while loading is the visual half of duplicate-submit protection.
    // The synchronous half lives in `useProductMutations`/the login handler,
    // because a second click can arrive before React re-renders the button.
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {isLoading ? <SpinnerIcon className="size-4 animate-spin" /> : null}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
