import { AppShell } from "@/components/layout/app-shell";
import { isSeriesAdminEmail } from "@/lib/admin/access";
import { getAuthUser, getCurrentProfile } from "@/lib/auth/session";

export default async function AnimeDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) return children;

  const profile = await getCurrentProfile();
  if (!profile) return children;

  return (
    <AppShell profile={profile} isSeriesAdmin={isSeriesAdminEmail(user.email)}>
      {children}
    </AppShell>
  );
}
