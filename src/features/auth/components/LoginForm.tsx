"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/form-controls";
import { SparklesIcon, WarningIcon } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DEMO_CREDENTIALS } from "@/lib/constants";
import { toApiError } from "@/lib/axios";
import { useToast } from "@/hooks/useToast";

/**
 * The sign-in form.
 *
 * The page chrome around it — the brand panel and the centred column — lives in
 * `app/(auth)/layout.tsx`, so this component is only the card. That keeps the
 * layout a layout concern and the form a feature concern.
 *
 * Errors surface in two places, matching how they arise:
 *   - an empty field is a client-side validation error, shown under that field;
 *   - a rejected credential comes back from the API as HTTP 400 and is shown in
 *     an alert above the form.
 *
 * Duplicate submissions are blocked twice over. `isSubmitting` disables the
 * button, and `inFlightRef` is a synchronous guard — React state updates are not
 * flushed before a second click in the same tick, so the ref is what actually
 * prevents two login requests.
 */

interface LoginFormProps {
  /** Where to go after a successful sign-in; already validated server-side. */
  nextPath: string;
}

interface FieldErrors {
  username?: string;
  password?: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const { login, status } = useAuth();
  const { pushToast } = useToast();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inFlightRef = useRef(false);

  /* Already signed in (or just signed in) — leave the login screen. */
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath);
    }
  }, [status, nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlightRef.current) return;

    const nextErrors: FieldErrors = {};
    if (username.trim() === "") nextErrors.username = "Enter your username.";
    if (password === "") nextErrors.password = "Enter your password.";
    setFieldErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    inFlightRef.current = true;
    setIsSubmitting(true);

    try {
      await login({ username: username.trim(), password });
      pushToast({
        tone: "success",
        title: "Welcome back",
        description: "You are signed in.",
      });
      // Navigation is handled by the effect above once the status flips.
    } catch (caught: unknown) {
      const error = toApiError(caught);
      // DummyJSON answers both "unknown user" and "wrong password" with 400
      // "Invalid credentials", so we show one message that covers both and does
      // not reveal which half was wrong.
      setFormError(
        error.status === 400
          ? "Incorrect username or password. Please try again."
          : error.message,
      );
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername(DEMO_CREDENTIALS.username);
    setPassword(DEMO_CREDENTIALS.password);
    setFieldErrors({});
    setFormError(null);
  };

  return (
    <div className="animate-slide-up rounded-2xl border border-slate-200/70 bg-white/90 p-7 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 ring-inset">
        <SparklesIcon className="size-3.5" />
        Admin access
      </span>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Use your account to manage the product catalogue.
      </p>

      {formError ? (
        <div
          role="alert"
          className="animate-fade-in mt-6 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 ring-inset"
        >
          <WarningIcon className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <Field label="Username" htmlFor="username" required error={fieldErrors.username}>
          <Input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="emilys"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            invalid={Boolean(fieldErrors.username)}
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Password" htmlFor="password" required error={fieldErrors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            invalid={Boolean(fieldErrors.password)}
            disabled={isSubmitting}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          isLoading={isSubmitting}
          loadingText="Signing in…"
        >
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200 ring-inset">
        <p className="text-xs text-slate-500">
          Demo account:{" "}
          <span className="font-semibold text-slate-700">
            {DEMO_CREDENTIALS.username} / {DEMO_CREDENTIALS.password}
          </span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={fillDemoCredentials}
          disabled={isSubmitting}
          className="mt-1.5 -ml-2 text-brand-700 hover:bg-brand-50"
        >
          Fill demo credentials
        </Button>
      </div>
    </div>
  );
}
