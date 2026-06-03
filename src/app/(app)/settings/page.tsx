import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";

export default async function SettingsPage() {
  const { profile } = await requireProfile();
  redirect(`/u/${profile.username}?edit=1`);
}
