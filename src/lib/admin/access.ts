import { redirect } from "next/navigation";

import { requireAuthUser } from "@/lib/auth/session";

function adminEmails(): Set<string> {
  const raw = process.env.SERIES_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isSeriesAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = adminEmails();
  if (allowed.size === 0) return false;
  return allowed.has(email.trim().toLowerCase());
}

export async function requireSeriesAdmin() {
  const user = await requireAuthUser();
  if (!isSeriesAdminEmail(user.email)) {
    redirect("/");
  }
  return user;
}
