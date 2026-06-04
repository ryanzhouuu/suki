"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { removeBannerFromForm, uploadBanner } from "@/actions/banner";
import type { ProfileActionState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database";

type BannerUploadProps = {
  profile: Tables<"profiles">;
};

export function BannerUpload({ profile }: BannerUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, uploadAction, uploadPending] = useActionState<
    ProfileActionState,
    FormData
  >(uploadBanner, {});
  const [removeState, removeAction, removePending] = useActionState<
    ProfileActionState,
    FormData
  >(removeBannerFromForm, {});

  const pending = uploadPending || removePending;
  const state = uploadState.error || uploadState.message
    ? uploadState
    : removeState;

  const previewUrl = profile.banner_url;

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [state.message, router]);

  return (
    <div className="space-y-3">
      <Label htmlFor="banner">Profile banner</Label>
      <div
        className={`relative overflow-hidden rounded-card border border-line ${
          previewUrl ? "bg-surface-2" : "bg-linear-to-r from-accent/30 via-accent/12 to-transparent"
        }`}
      >
        <div className="aspect-3/1 w-full sm:aspect-4/1">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-surface/90 via-surface/20 to-transparent"
            aria-hidden
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <form action={uploadAction}>
          <input
            ref={inputRef}
            id="banner"
            name="banner"
            type="file"
            accept="image/jpeg,image/png,image/webp"
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
                ? "Replace banner"
                : "Upload banner"}
          </Button>
        </form>
        {previewUrl ? (
          <form action={removeAction}>
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              {removePending ? "Removing…" : "Remove banner"}
            </Button>
          </form>
        ) : null}
      </div>
      <p className="text-xs text-faint">
        Wide images work best (about 3:1). JPEG, PNG, or WebP up to 5 MB.
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
    </div>
  );
}
