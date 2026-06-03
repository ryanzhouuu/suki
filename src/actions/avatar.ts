"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { AVATAR_BUCKET } from "@/lib/avatars/constants";
import { avatarObjectPath, validateAvatarFile } from "@/lib/avatars/validate";
import { createClient } from "@/lib/supabase/server";

import type { ProfileActionState } from "./profile";

async function revalidateAvatarPaths(userId: string) {
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

async function deleteStoredAvatars(userId: string) {
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId);

  if (!files?.length) return;

  const paths = files.map((file) => `${userId}/${file.name}`);
  await supabase.storage.from(AVATAR_BUCKET).remove(paths);
}

export async function uploadAvatar(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireAuthUser();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return { error: "Please choose an image." };
  }

  const validationError = validateAvatarFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const objectPath = avatarObjectPath(user.id, file.type);
  if (!objectPath) {
    return { error: "Use a JPEG, PNG, WebP, or GIF image." };
  }

  const supabase = await createClient();

  await deleteStoredAvatars(user.id);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);

  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  await revalidateAvatarPaths(user.id);

  return { message: "Avatar updated." };
}

async function removeAvatar(): Promise<ProfileActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  await deleteStoredAvatars(user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  await revalidateAvatarPaths(user.id);

  return { message: "Avatar removed." };
}

export async function removeAvatarFromForm(
  _prev: ProfileActionState,
  _formData: FormData,
): Promise<ProfileActionState> {
  return removeAvatar();
}
