import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

/** Deduped per request — layout + pages share one auth round-trip. */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const requireAuthUser = cache(async () => {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
});

export const getCurrentProfile = cache(
  async (): Promise<Tables<"profiles"> | null> => {
    const user = await getAuthUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return data;
  },
);

export const requireProfile = cache(async () => {
  const user = await requireAuthUser();
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/onboarding");
  }
  return { user, profile };
});
