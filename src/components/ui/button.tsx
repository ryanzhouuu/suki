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
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
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
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
