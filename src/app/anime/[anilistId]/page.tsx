import { PlaceholderPage } from "@/components/ui/placeholder-page";

type AnimeDetailPageProps = {
  params: Promise<{ anilistId: string }>;
};

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { anilistId } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PlaceholderPage
        title={`Anime #${anilistId}`}
        description="Metadata from AniList plus your tracking status and progress."
        milestone="Milestone 1–2"
      />
    </div>
  );
}
