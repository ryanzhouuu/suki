import Link from "next/link";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <PlaceholderPage
        title="Sign in"
        description="Email/password and OAuth via Supabase Auth."
        milestone="Milestone 1"
      />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link href="/auth/signup" className="font-medium text-zinc-900 dark:text-zinc-50">
          Sign up
        </Link>
      </p>
    </div>
  );
}
