"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { BANNER_BUCKET } from "@/lib/banners/constants";
import { bannerObjectPath, validateBannerFile } from "@/lib/banners/validate";
import { createClient } from "@/lib/supabase/server";

import type { ProfileActionState } from "./profile";

async function revalidateBannerPaths(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", userId)
    .single();

  revalidatePath("/settings");
  if (profile?.username) {
    revalidatePath(`/u/${profile.username}`);
  }
}

async function deleteStoredBanners(userId: string) {
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from(BANNER_BUCKET).list(userId);

  if (!files?.length) return;

  const paths = files.map((file) => `${userId}/${file.name}`);
  await supabase.storage.from(BANNER_BUCKET).remove(paths);
}

export async function uploadBanner(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireAuthUser();
  const file = formData.get("banner");

  if (!(file instanceof File)) {
    return { error: "Please choose an image." };
  }

  const validationError = validateBannerFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const objectPath = bannerObjectPath(user.id, file.type);
  if (!objectPath) {
    return { error: "Use a JPEG, PNG, or WebP image." };
  }

  const supabase = await createClient();

  await deleteStoredBanners(user.id);

  const { error: uploadError } = await supabase.storage
    .from(BANNER_BUCKET)
    .upload(objectPath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BANNER_BUCKET).getPublicUrl(objectPath);

  const bannerUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ banner_url: bannerUrl })
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  await revalidateBannerPaths(user.id);

  return { message: "Banner updated." };
}

async function removeBanner(): Promise<ProfileActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  await deleteStoredBanners(user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ banner_url: null })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  await revalidateBannerPaths(user.id);

  return { message: "Banner removed." };
}

export async function removeBannerFromForm(
  _prev: ProfileActionState,
  _formData: FormData,
): Promise<ProfileActionState> {
  return removeBanner();
}
