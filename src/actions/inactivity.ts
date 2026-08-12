"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { parseInactivityDays } from "@/lib/inactivity/settings";
import { createClient } from "@/lib/supabase/server";

export type InactivityActionState = {
  error?: string;
  message?: string;
  resolvedEntryId?: string;
};

export async function updateInactivitySettings(
  _previous: InactivityActionState,
  formData: FormData,
): Promise<InactivityActionState> {
  const user = await requireAuthUser();
  const autoPauseDays = parseInactivityDays(formData.get("auto_pause_days"));
  const dropPromptDays = parseInactivityDays(formData.get("drop_prompt_days"));

  if (autoPauseDays === null || dropPromptDays === null) {
    return { error: "Choose a number of days from 7 to 365." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      auto_pause_days: autoPauseDays,
      drop_prompt_days: dropPromptDays,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/home");
  revalidatePath("/settings");
  return { message: "Library automation settings updated." };
}

export async function resolveInactivityPrompt(
  _previous: InactivityActionState,
  formData: FormData,
): Promise<InactivityActionState> {
  await requireAuthUser();
  const entryId = String(formData.get("entry_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      entryId,
    )
  ) {
    return { error: "Invalid library entry." };
  }
  if (decision !== "drop" && decision !== "keep_paused") {
    return { error: "Choose whether to drop or keep this anime paused." };
  }

  const supabase = await createClient();
  const { data: resolved, error } = await supabase.rpc(
    "resolve_anime_inactivity_prompt",
    { p_entry_id: entryId, p_should_drop: decision === "drop" },
  );

  if (error) return { error: error.message };
  if (!resolved) {
    return {
      error: "This reminder is no longer available. Refresh and try again.",
    };
  }

  revalidatePath("/home");
  revalidatePath("/library");
  return {
    message: decision === "drop" ? "Moved to dropped." : "Kept paused for now.",
    resolvedEntryId: entryId,
  };
}
