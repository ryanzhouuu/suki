import { redirect } from "next/navigation";

import { completeProfile } from "@/actions/profile";
import { APP_NAME } from "@/lib/constants";
import { getAuthUser, getCurrentProfile } from "@/lib/auth/session";

import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const profile = await getCurrentProfile();
  if (profile) redirect("/home");

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="animate-rise">
        <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-xl font-semibold text-on-accent shadow-sm">
          好
        </span>
        <p className="eyebrow">One last step</p>
        <h1 className="mt-1.5 text-3xl font-semibold">Welcome to {APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted">
          Pick a unique username. Your profile and lists are public by default —
          your account details always stay private.
        </p>
        <div className="mt-8 card p-7 shadow-[0_12px_40px_-24px_rgb(var(--shadow-color)/0.45)]">
          <OnboardingForm action={completeProfile} />
        </div>
      </div>
    </div>
  );
}
