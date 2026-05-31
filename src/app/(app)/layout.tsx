import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAuthUser, getCurrentProfile } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
