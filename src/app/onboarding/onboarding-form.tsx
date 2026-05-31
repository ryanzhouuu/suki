"use client";

import { useActionState } from "react";

import type { ProfileActionState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OnboardingFormProps = {
  action: (
    prev: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
};

export function OnboardingForm({ action }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          autoComplete="username"
          placeholder="your_name"
        />
        <p className="mt-1.5 text-xs text-faint">
          Letters, numbers, and underscores only.
        </p>
      </div>
      <div>
        <Label htmlFor="display_name">Display name (optional)</Label>
        <Input id="display_name" name="display_name" maxLength={50} />
      </div>
      <div>
        <Label htmlFor="bio">Bio (optional)</Label>
        <Input id="bio" name="bio" maxLength={300} />
      </div>
      {state.error ? (
        <p
          className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
