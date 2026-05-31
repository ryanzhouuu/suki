import Link from "next/link";
import { redirect } from "next/navigation";

import { signUp } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { APP_NAME } from "@/lib/constants";
import { getAuthUser } from "@/lib/auth/session";

export default async function SignupPage() {
  const user = await getAuthUser();
  if (user) redirect("/onboarding");

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold">Join {APP_NAME}</h1>
      <div className="mt-8">
        <AuthForm action={signUp} submitLabel="Create account" showConfirm />
      </div>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-zinc-900 dark:text-zinc-50">
          Sign in
        </Link>
      </p>
    </div>
  );
}
