import Link from "next/link";

import { updateProfile } from "@/actions/profile";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireProfile } from "@/lib/auth/session";

export default async function SettingsPage() {
  const { profile } = await requireProfile();

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-20 sm:pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Update how you appear on your{" "}
          <Link href={`/u/${profile.username}`} className="font-medium underline">
            public profile
          </Link>
          .
        </p>
      </div>
      <SettingsForm profile={profile} action={updateProfile} />
      <p className="text-xs text-zinc-500">
        Username <strong>@{profile.username}</strong> cannot be changed in the
        MVP.
      </p>
    </div>
  );
}
