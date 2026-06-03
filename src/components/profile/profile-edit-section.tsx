"use client";

import Link from "next/link";

import { updateProfile } from "@/actions/profile";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database";

type ProfileEditSectionProps = {
  profile: Tables<"profiles">;
  editing: boolean;
};

export function ProfileEditSection({ profile, editing }: ProfileEditSectionProps) {
  const profilePath = `/u/${profile.username}`;

  if (editing) {
    return (
      <section className="rounded-card border border-line bg-surface p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Your profile</p>
            <h2 className="mt-1 text-xl font-semibold">Edit profile</h2>
          </div>
          <Link href={profilePath}>
            <Button type="button" variant="ghost" size="sm">
              Done
            </Button>
          </Link>
        </div>
        <ProfileEditForm profile={profile} action={updateProfile} />
      </section>
    );
  }

  return (
    <Link href={`${profilePath}?edit=1`}>
      <Button type="button" size="sm" variant="secondary">
        Edit profile
      </Button>
    </Link>
  );
}
