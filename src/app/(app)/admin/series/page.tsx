import { SeriesOverridesAdmin } from "@/components/admin/series-overrides-admin";
import { listSeriesOverrides } from "@/actions/series-admin";
import { requireSeriesAdmin } from "@/lib/admin/access";

export default async function AdminSeriesPage() {
  await requireSeriesAdmin();
  const overrides = await listSeriesOverrides();

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-24 sm:pb-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Series overrides</h1>
        <p className="mt-2 text-muted">
          Manually group or split anime for series-level rankings. Changes apply
          globally and clean up orphaned series rows, comparisons, and rankings.
        </p>
      </div>
      <SeriesOverridesAdmin initialOverrides={overrides} />
    </div>
  );
}
