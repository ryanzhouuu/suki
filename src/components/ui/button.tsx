import { type ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-accent text-on-accent shadow-sm hover:bg-accent-strong active:translate-y-px",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-accent hover:text-accent",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  danger: "border border-line-strong bg-surface text-danger hover:bg-accent-soft",
} as const;

const sizes = {
  sm: "min-h-10 px-3 py-2 text-xs sm:min-h-0 sm:py-1.5",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-11 px-5 py-2.5 text-sm",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
