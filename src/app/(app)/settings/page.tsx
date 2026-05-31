import Link from "next/link";

import { updateProfile } from "@/actions/profile";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireProfile } from "@/lib/auth/session";

export default async function SettingsPage() {
  const { profile } = await requireProfile();

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24 sm:pb-8">
      <div>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Settings</h1>
        <p className="mt-2 text-muted">
          Update how you appear on your{" "}
          <Link
            href={`/u/${profile.username}`}
            className="font-medium text-accent hover:underline"
          >
            public profile
          </Link>
          .
        </p>
      </div>
      <div className="card p-6">
        <SettingsForm profile={profile} action={updateProfile} />
      </div>
      <p className="text-xs text-faint">
        Username <strong className="text-muted">@{profile.username}</strong>{" "}
        cannot be changed in the MVP.
      </p>
    </div>
  );
}
