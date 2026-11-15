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
      <div className="flex min-h-48 items-center justify-center text-center">
        <p className="max-w-56 text-sm leading-relaxed text-muted">
          The trait radar appears once three traits are discovered.
        </p>
      </div>
    );
  }

  return (
    <figure className="flex flex-col items-center">

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
                className="text-[11px] font-semibold"
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-center text-sm text-muted">
        Trait strength, numbered strongest first
      </figcaption>
    </figure>
  );
}
