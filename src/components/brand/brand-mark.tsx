import type { SVGProps } from "react";

import { APP_NAME } from "@/lib/constants";

type BrandMarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  label?: string;
};

/**
 * The hand-drawn スキ stamp. Paths keep the mark consistent across platforms
 * and let it stay crisp from the browser icon up through the oversized hero.
 */
export function BrandMark({ label, ...props }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      <path
        d="M8.7 8.4C22.8 7.1 45.8 7.6 59.5 8.8C61.4 19.8 61.2 45.4 59.7 59.7C46.6 61.2 21.1 61.1 8.5 59.6C7.3 47.1 7.2 20.2 8.7 8.4Z"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 10.1C21.6 9.2 43.8 9.3 57.8 10.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.42"
      />

      {/* ス */}
      <path
        d="M16.1 23.2C23.3 22.8 31.9 20.9 37.5 19.4"
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M37.5 19.4C35.5 29.6 28.3 40.6 16 47.7"
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M29.4 35.1C34.4 37.8 38.9 42.3 42.5 47.1"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* キ */}
      <path
        d="M46 19.2C51.3 18.8 56.4 18.1 60.3 17.2"
        stroke="currentColor"
        strokeWidth="4.1"
        strokeLinecap="round"
      />
      <path
        d="M44.8 28C51 27.6 57 26.6 61.9 25.4"
        stroke="currentColor"
        strokeWidth="4.1"
        strokeLinecap="round"
      />
      <path
        d="M52.1 14.1C53.4 24 55.5 37.3 57.6 48.8"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinecap="round"
      />

      {/* Escaping end-card stroke and spark. */}
      <path
        d="M42.2 36.2C49.8 34.9 58.3 31.9 65.1 28.7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M66.2 22.1C66.8 25.1 68.2 26.6 71 27.2C68.2 27.8 66.8 29.4 66.2 32.5C65.6 29.4 64.2 27.8 61.4 27.2C64.2 26.6 65.6 25.1 66.2 22.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

type BrandLockupProps = {
  inverted?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export function BrandLockup({
  inverted = false,
  className = "",
  markClassName = "",
  wordmarkClassName = "",
}: BrandLockupProps) {
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <BrandMark
        className={`h-9 w-9 shrink-0 text-accent transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-[1.04] ${markClassName}`}
      />
      <span
        className={`truncate font-display text-2xl font-semibold tracking-tight ${
          inverted ? "text-white" : "text-ink"
        } ${wordmarkClassName}`}
      >
        {APP_NAME}
      </span>
    </span>
  );
}
