import { type InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-accent sm:text-sm ${className}`}
      {...props}
    />
  );
}
