"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";

export type DigestActionState = { error?: string };

export async function markDigestViewed(digestId: string): Promise<void> {
  const user = await requireAuthUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_digests")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", digestId)
    .eq("user_id", user.id)
    .is("viewed_at", null)
    .select("id")
    .maybeSingle();
  if (data) {
    await logUserEvent(user.id, USER_EVENT_TYPES.digestViewed, {
      metadata: { digestId },
    }).catch(() => undefined);
  }
}

export async function dismissDigest(
  _previous: DigestActionState,
  formData: FormData,
): Promise<DigestActionState> {
  const digestId = String(formData.get("digest_id") ?? "");
  const user = await requireAuthUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_digests")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", digestId)
    .eq("user_id", user.id)
    .select("id, viewed_at")
    .maybeSingle();
  if (error || !data) return { error: "Could not dismiss this weekly recap." };
  await logUserEvent(user.id, USER_EVENT_TYPES.digestDismissed, {
    metadata: { digestId, dismissedBeforeViewing: data.viewed_at === null },
  }).catch(() => undefined);
  revalidatePath("/home");
  return {};
}

export async function logDigestAction(
  digestId: string,
  section: string,
  actionKind: string,
): Promise<void> {
  const user = await requireAuthUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_digests")
    .select("id")
    .eq("id", digestId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return;
  await logUserEvent(user.id, USER_EVENT_TYPES.digestActionClicked, {
    metadata: { digestId, section, actionKind },
  }).catch(() => undefined);
}

