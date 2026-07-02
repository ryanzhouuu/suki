"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn, signUp } from "@/actions/auth";
import { AuthErrorBanner } from "@/components/auth/auth-error";
import { AuthForm } from "@/components/auth/auth-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

type AuthMode = "signin" | "signup";

type AuthPanelProps = {
  initialMode: AuthMode;
  error?: string;
};

const MODE_COPY: Record<
  AuthMode,
  { eyebrow: string; title: string; description: string }
> = {
  signin: {
    eyebrow: "Welcome back",
    title: "Sign in",
    description: "Pick up your lists and rankings right where you left off.",
  },
  signup: {
    eyebrow: "Start tracking",
    title: "Create account",
    description: "Build your watchlist and rank favorites in seconds.",
  },
};

export function AuthPanel({ initialMode, error }: AuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const copy = MODE_COPY[mode];

  function switchMode(next: AuthMode) {
    setMode(next);
    const url = next === "signup" ? "/auth/login?mode=signup" : "/auth/login";
    router.replace(url, { scroll: false });
  }

  return (
    <div className="card p-7 shadow-[0_12px_40px_-24px_rgb(var(--shadow-color)/0.45)]">
      <div className="flex rounded-full border border-line bg-surface-2 p-1">
        {(["signin", "signup"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => switchMode(option)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              mode === option
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
            aria-pressed={mode === option}
          >
            {option === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <p className="eyebrow mt-6">{copy.eyebrow}</p>
      <h1 className="mt-1.5 text-3xl font-semibold">{copy.title}</h1>
      <p className="mt-1 text-sm text-muted">{copy.description}</p>

      <div className="mt-7 space-y-4">
        <OAuthButtons />
        <AuthErrorBanner code={error} />
        {mode === "signin" ? (
          <AuthForm key="signin" action={signIn} submitLabel="Sign in" />
        ) : (
          <AuthForm
            key="signup"
            action={signUp}
            submitLabel="Create account"
            showConfirm
          />
        )}
      </div>
    </div>
  );
}
