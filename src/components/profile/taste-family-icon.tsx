import type { TraitFamily } from "@/lib/fingerprint/types";

type TasteFamilyIconProps = {
  family: TraitFamily;
  className?: string;
};

const PATHS: Record<TraitFamily, React.ReactNode> = {
  content: (
    <>
      <path d="m12 2 2.2 5.1L19 9l-4.8 1.9L12 16l-2.2-5.1L5 9l4.8-1.9L12 2Z" />
      <path d="m5 15 .9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9L5 15Z" />
    </>
  ),
  breadth: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
    </>
  ),
  discovery: (
    <>
      <path d="M4 19V9l8-5 8 5v10l-8 3-8-3Z" />
      <path d="m4 9 8 4 8-4M12 13v9" />
    </>
  ),
  format: (
    <>
      <rect x="3" y="5" width="18" height="13" rx="2" />
      <path d="m10 9 5 3-5 3V9ZM8 22h8" />
    </>
  ),
  behavior: (
    <>
      <path d="M20 7h-7a5 5 0 0 0-5 5v1" />
      <path d="m17 4 3 3-3 3M4 17h7a5 5 0 0 0 5-5v-1" />
      <path d="m7 20-3-3 3-3" />
    </>
  ),
  rating: (
    <>
      <path d="M12 21s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.4-8 11-8 11Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  ranking: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v1a4 4 0 0 0 4 4m8-5h4v1a4 4 0 0 1-4 4M12 13v4m-4 3h8" />
    </>
  ),
};

export function TasteFamilyIcon({
  family,
  className = "h-5 w-5",
}: TasteFamilyIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[family]}
    </svg>
  );
}
