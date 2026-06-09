"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ProfileActionState } from "@/actions/profile";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { BannerUpload } from "@/components/profile/banner-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database";

type ProfileEditFormProps = {
  profile: Tables<"profiles">;
  action: (
    prev: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
};

export function ProfileEditForm({ profile, action }: ProfileEditFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [state.message, router]);

  return (
    <div className="space-y-6">
      <BannerUpload profile={profile} />
      <AvatarUpload profile={profile} />
      <form action={formAction} className="space-y-4 border-t border-line pt-6">
        <div>
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            maxLength={50}
          />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={300} />
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/40 p-3">
          <input
            type="checkbox"
            name="show_activity_to_friends"
            defaultChecked={profile.show_activity_to_friends}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
          />
          <span className="text-sm">
            <span className="font-medium text-ink">
              Show my activity to friends
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Let accepted friends see when you complete, plan, or rank anime in
              their activity feed.
            </span>
          </span>
        </label>
        <p className="text-xs text-faint">
          Username <strong className="text-muted">@{profile.username}</strong>{" "}
          cannot be changed in the MVP.
        </p>
        {state.error ? (
          <p
            className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p
            className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-success"
            role="status"
          >
            {state.message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
        <div>
          <p className="text-sm font-semibold text-ink">Import a list</p>
          <p className="text-xs text-muted">
            Bring titles in from AniList, MyAnimeList, or plain text.
          </p>
        </div>
        <Link href="/import">
          <Button type="button" variant="secondary" size="sm">
            Import
          </Button>
        </Link>
      </div>
    </div>
  );
}
