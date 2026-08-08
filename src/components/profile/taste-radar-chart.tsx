import type { TasteFingerprint } from "@/lib/fingerprint";

type FingerprintTrait = TasteFingerprint["traits"][number];

type TasteRadarChartProps = {
  traits: FingerprintTrait[];
};

const CENTER = 120;
const RADIUS = 78;

function point(index: number, count: number, scale = 1) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
  return {
    x: CENTER + Math.cos(angle) * RADIUS * scale,
    y: CENTER + Math.sin(angle) * RADIUS * scale,
  };
}

function points(count: number, scale = 1) {
  return Array.from({ length: count }, (_, index) => {
    const value = point(index, count, scale);
    return `${value.x},${value.y}`;
  }).join(" ");
}

function strengthPoints(traits: FingerprintTrait[]) {
  return traits
    .map((trait, index) => {
      const strength = Math.max(0, Math.min(1, trait.strength));
      const value = point(index, traits.length, strength);
      return `${value.x},${value.y}`;
    })
    .join(" ");
}

export function TasteRadarChart({ traits }: TasteRadarChartProps) {
  if (traits.length < 3) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface/55 p-6 text-center">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
            Signal map locked
          </p>
          <p className="mt-2 max-w-52 text-sm leading-relaxed text-muted">
            Three discovered traits are needed to draw this readout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <figure className="relative flex min-h-72 flex-col overflow-hidden rounded-xl border border-line bg-surface/70 p-4 sm:p-5">
      <figcaption className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
            Signal map
          </p>
          <p className="mt-1 text-sm text-muted">Trait strength by loadout slot</p>
        </div>
        <span className="rounded border border-line-strong bg-surface-2 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted">
          Live data
        </span>
      </figcaption>

      <svg
        role="img"
        aria-label="Taste trait strength radar"
        viewBox="0 0 240 240"
        className="mx-auto mt-1 aspect-square w-full max-w-72 overflow-visible text-line-strong"
      >
        <title>Taste trait strength radar</title>
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={points(traits.length, scale)}
            fill="none"
            stroke="currentColor"
            strokeWidth={scale === 1 ? 1.5 : 1}
            opacity={scale === 1 ? 0.75 : 0.45}
          />
        ))}
        {traits.map((trait, index) => {
          const outer = point(index, traits.length);
          return (
            <line
              key={trait.id}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.45"
            />
          );
        })}
        <polygon
          points={strengthPoints(traits)}
          fill="var(--accent)"
          fillOpacity="0.18"
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        {traits.map((trait, index) => {
          const strength = Math.max(0, Math.min(1, trait.strength));
          const value = point(index, traits.length, strength);
          const label = point(index, traits.length, 1.2);
          return (
            <g key={trait.id}>
              <circle
                cx={value.x}
                cy={value.y}
                r="4"
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="2.5"
              />
              <text
                x={label.x}
                y={label.y}
                dominantBaseline="middle"
                textAnchor="middle"
                fill="var(--ink)"
                className="font-mono text-[10px] font-semibold"
              >
                {String(index + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
