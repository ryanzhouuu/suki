import Image from "next/image";

type AnimePosterProps = {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  /** Full-width cover in a 2:3 aspect container (for library cards, etc.). */
  fill?: boolean;
  className?: string;
};

const sizes = {
  sm: { w: 48, h: 68, class: "h-[68px] w-12" },
  md: { w: 80, h: 114, class: "h-[114px] w-20" },
  lg: { w: 120, h: 171, class: "h-[171px] w-[120px]" },
};

export function AnimePoster({
  src,
  alt,
  size = "md",
  fill = false,
  className = "",
}: AnimePosterProps) {
  const dim = sizes[size];

  if (fill) {
    return (
      <div
        className={`relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-2 ${className}`}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`shrink-0 rounded-lg bg-surface-2 ${dim.class} ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={dim.w}
      height={dim.h}
      className={`shrink-0 rounded-lg object-cover ${dim.class} ${className}`}
      unoptimized
    />
  );
}
