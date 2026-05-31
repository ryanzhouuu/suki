import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuthUser() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function getCurrentProfile(): Promise<Tables<"profiles"> | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function requireProfile() {
  const user = await requireAuthUser();
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/onboarding");
  }
  return { user, profile };
}
