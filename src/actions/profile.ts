"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthUser } from "@/lib/auth/session";
import {
  normalizeUsername,
  validateUsername,
} from "@/lib/profiles/validate";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error?: string;
  message?: string;
};

export async function completeProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireAuthUser();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("display_name") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  const usernameError = validateUsername(username);
  if (usernameError) {
    return { error: usernameError };
  }

  const supabase = await createClient();

  const { data: taken } = await supabase
    .from("profiles")
    .select("user_id")
    .ilike("username", username)
    .neq("user_id", user.id)
    .maybeSingle();

  if (taken) {
    return { error: "This username is already taken." };
  }

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    username,
    display_name: displayName,
    bio,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This username is already taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/home");
  revalidatePath("/setup/library");
  redirect("/setup/library");
}

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireAuthUser();
  const displayName = String(formData.get("display_name") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  // Unchecked checkboxes don't submit, so presence == opted in.
  const showActivityToFriends =
    formData.get("show_activity_to_friends") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio,
      show_activity_to_friends: showActivityToFriends,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .single();

  revalidatePath("/settings");
  if (profile?.username) {
    revalidatePath(`/u/${profile.username}`);
  }

  return { message: "Profile updated." };
}
