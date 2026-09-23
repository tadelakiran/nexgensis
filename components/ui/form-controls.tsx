import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Form primitives.
 *
 * One `controlClasses` helper drives every control so focus rings, invalid states
 * and disabled styling stay identical across inputs, textareas and selects.
 */

export function controlClasses(invalid: boolean, extra?: string): string {
  return [
    "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 transition placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500",
    invalid
      ? "ring-rose-300 focus:ring-2 focus:ring-rose-400"
      : "ring-slate-200 hover:ring-slate-300 focus:ring-2 focus:ring-brand-500",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired for screen readers. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required ? (
          <span className="ml-0.5 text-rose-500" aria-hidden="true">
            *
          </span>
        ) : null}
        {!required ? <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span> : null}
      </label>

      {children}

      {/* `role="alert"` means a validation message is announced the moment it
          appears, without needing aria-describedby on the control. */}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="animate-fade-in text-xs font-medium text-rose-600"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, className)}
      {...rest}
    />
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, `min-h-28 resize-y ${className ?? ""}`)}
      {...rest}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid = false, className, children, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={controlClasses(
        invalid,
        // A native select needs its own arrow once the default appearance is gone.
        `cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${className ?? ""}`,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
