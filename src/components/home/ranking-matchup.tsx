import Link from "next/link";

import { CreditLine } from "@/components/home/credit-line";
import { heroPrimaryClass } from "@/components/home/hero-frame";

type Side = {
  title: string;
  imageUrl: string | null;
};

/** Wide split banner for the next pairwise ranking prompt. */
export function RankingMatchup({ left, right }: { left: Side; right: Side }) {
  return (
    <section className="relative grid min-h-72 grid-cols-2 overflow-hidden rounded-card sm:min-h-80">
      <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
        <CreditLine
          onArt
          parts={[
            { text: "Tonight's matchup", tone: "accent" },
            { text: "Ranking" },
          ]}
        />
      </div>
      <Half title={left.title} imageUrl={left.imageUrl} align="left" />
      <Half title={right.title} imageUrl={right.imageUrl} align="right" />
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
        <p className="font-display text-5xl italic leading-none text-accent sm:text-7xl">vs</p>
        <Link href="/ranking" className={`pointer-events-auto ${heroPrimaryClass}`}>
          Pick one
        </Link>
      </div>
    </section>
  );
}

export function RankingLocked() {
  return (
    <aside className="rounded-card border border-dashed border-line-strong bg-surface/50 p-6">
      <p className="credit-line">
        <span className="text-accent">Ranking</span>
      </p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Complete anime in at least two series to unlock pairwise rankings.
      </p>
    </aside>
  );
}

function Half({
  title,
  imageUrl,
  align,
}: Side & { align: "left" | "right" }) {
  return (
    <div className="relative min-h-72 overflow-hidden bg-[#141216] sm:min-h-80">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/40" />
      <p
        className={`absolute bottom-4 max-w-[14rem] font-display text-lg font-medium leading-snug text-white sm:max-w-xs sm:text-2xl ${
          align === "right" ? "right-4 text-right" : "left-4"
        }`}
      >
        {title}
      </p>
    </div>
  );
}
