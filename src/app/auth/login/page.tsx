import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn } from "@/actions/auth";
import { AuthErrorBanner } from "@/components/auth/auth-error";
import { AuthForm } from "@/components/auth/auth-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { APP_NAME } from "@/lib/constants";
import { getAuthUser } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; error_description?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getAuthUser();
  if (user) redirect("/home");

  const { error, error_description: errorDescription } = await searchParams;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="animate-rise">
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-lg font-semibold text-on-accent shadow-sm">
            好
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </Link>
        <div className="card p-7 shadow-[0_12px_40px_-24px_rgb(var(--shadow-color)/0.45)]">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-1.5 text-3xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Pick up your lists and rankings right where you left off.
          </p>
          <div className="mt-7 space-y-4">
            <OAuthButtons />
            <AuthErrorBanner code={error} description={errorDescription} />
            <AuthForm action={signIn} submitLabel="Sign in" />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          New to {APP_NAME}?{" "}
          <Link href="/auth/signup" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
