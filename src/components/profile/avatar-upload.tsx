"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { removeAvatarFromForm, uploadAvatar } from "@/actions/avatar";
import type { ProfileActionState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database";

type AvatarUploadProps = {
  profile: Tables<"profiles">;
};

export function AvatarUpload({ profile }: AvatarUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, uploadAction, uploadPending] = useActionState<
    ProfileActionState,
    FormData
  >(uploadAvatar, {});
  const [removeState, removeAction, removePending] = useActionState<
    ProfileActionState,
    FormData
  >(removeAvatarFromForm, {});

  const pending = uploadPending || removePending;
  const state = uploadState.error || uploadState.message
    ? uploadState
    : removeState;

  const initial =
    (profile.display_name || profile.username || "?")[0]?.toUpperCase() ?? "?";
  const previewUrl = profile.avatar_url;

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [state.message, router]);

  return (
    <div className="space-y-3">
      <Label htmlFor="avatar">Avatar</Label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 text-2xl font-semibold text-ink">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <form action={uploadAction} className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={pending}
              onChange={(event) => {
                const form = event.currentTarget.form;
                if (form && event.currentTarget.files?.length) {
                  form.requestSubmit();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {uploadPending
                ? "Uploading…"
                : previewUrl
                  ? "Replace photo"
                  : "Upload photo"}
            </Button>
          </form>
          {previewUrl ? (
            <form action={removeAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={pending}
              >
                {removePending ? "Removing…" : "Remove photo"}
              </Button>
            </form>
          ) : null}
          <p className="text-xs text-faint">JPEG, PNG, WebP, or GIF up to 2 MB.</p>
        </div>
      </div>
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
    </div>
  );
}
