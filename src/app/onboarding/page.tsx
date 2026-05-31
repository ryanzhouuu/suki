import { redirect } from "next/navigation";

import { completeProfile } from "@/actions/profile";
import { APP_NAME } from "@/lib/constants";
import { getAuthUser, getCurrentProfile } from "@/lib/auth/session";

import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const profile = await getCurrentProfile();
  if (profile) redirect("/");

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold">Welcome to {APP_NAME}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Pick a unique username. Your profile and lists are public by default.
      </p>
      <OnboardingForm action={completeProfile} />
    </div>
  );
}
