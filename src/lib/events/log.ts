import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function logUserEvent(
  userId: string,
  eventType: string,
  options?: { animeId?: string; metadata?: Json },
) {
  const supabase = await createClient();
  await supabase.from("user_events").insert({
    user_id: userId,
    event_type: eventType,
    anime_id: options?.animeId ?? null,
    metadata: options?.metadata ?? {},
  });
}
