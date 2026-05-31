import { PlaceholderPage } from "@/components/ui/placeholder-page";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;

  return (
    <div className="pb-8">
      <PlaceholderPage
        title={`@${username}`}
        description="Public profile with top rankings, lists, and friend actions."
        milestone="Milestone 4"
      />
    </div>
  );
}
