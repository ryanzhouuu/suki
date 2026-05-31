"use client";

import { useActionState } from "react";

import type { ProfileActionState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database";

type SettingsFormProps = {
  profile: Tables<"profiles">;
  action: (
    prev: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
};

export function SettingsForm({ profile, action }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
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
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={profile.avatar_url ?? ""}
          placeholder="https://…"
        />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Input id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={300} />
      </div>
      {state.error ? (
        <p
          className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
