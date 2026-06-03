import Link from "next/link";
import { redirect } from "next/navigation";

import { signUp } from "@/actions/auth";
import { AuthErrorBanner } from "@/components/auth/auth-error";
import { AuthForm } from "@/components/auth/auth-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { APP_NAME } from "@/lib/constants";
import { getAuthUser } from "@/lib/auth/session";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getAuthUser();
  if (user) redirect("/onboarding");

  const { error } = await searchParams;

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
          <p className="eyebrow">Start tracking</p>
          <h1 className="mt-1.5 text-3xl font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-muted">
            Build your watchlist and rank favorites in seconds.
          </p>
          <div className="mt-7 space-y-4">
            <OAuthButtons />
            <AuthErrorBanner code={error} />
            <AuthForm action={signUp} submitLabel="Create account" showConfirm />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
