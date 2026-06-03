import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { APP_NAME } from "@/lib/constants";
import { getAuthUser, getCurrentProfile } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; error_description?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getAuthUser();
  if (user) {
    const profile = await getCurrentProfile();
    redirect(profile ? "/home" : "/onboarding");
  }

  const { error, error_description: errorDescription, mode } = await searchParams;
  const initialMode = mode === "signup" ? "signup" : "signin";

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
        <AuthPanel
          initialMode={initialMode}
          error={error}
          errorDescription={errorDescription}
        />
      </div>
    </div>
  );
}
