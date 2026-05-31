import Link from "next/link";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <PlaceholderPage
        title="Create account"
        description="Sign up, then choose a unique username to complete your profile."
        milestone="Milestone 1"
      />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-zinc-900 dark:text-zinc-50">
          Sign in
        </Link>
      </p>
    </div>
  );
}
