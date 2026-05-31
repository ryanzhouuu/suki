import Image from "next/image";

type AnimePosterProps = {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { w: 48, h: 68, class: "h-[68px] w-12" },
  md: { w: 80, h: 114, class: "h-[114px] w-20" },
  lg: { w: 120, h: 171, class: "h-[171px] w-[120px]" },
};

export function AnimePoster({ src, alt, size = "md" }: AnimePosterProps) {
  const dim = sizes[size];

  if (!src) {
    return (
      <div
        className={`shrink-0 rounded-lg bg-surface-2 ${dim.class}`}
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
      className={`shrink-0 rounded-lg object-cover ${dim.class}`}
      unoptimized
    />
  );
}
