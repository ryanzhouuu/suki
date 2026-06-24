"use client";

import { useId, useState } from "react";

export type InlineSelectOption = {
  value: string;
  label: string;
};

type InlineSelectProps = {
  value: string;
  options: InlineSelectOption[];
  onChange: (value: string) => void;
  /** When set, a hidden input mirrors the value so it submits with the form. */
  name?: string;
  /** Associates with an external <label htmlFor=...>. */
  id?: string;
  ariaLabel?: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function InlineSelect({
  value,
  options,
  onChange,
  name,
  id,
  ariaLabel,
}: InlineSelectProps) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const listboxId = `${buttonId}-listbox`;
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  function handleSelect(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-line-strong bg-paper px-2.5 py-1.5 text-left text-sm text-ink transition-colors hover:border-accent"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="grid gap-1 rounded-xl border border-line bg-surface p-1"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => handleSelect(option.value)}
                className={`flex min-h-8 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  active
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span>{option.label}</span>
                {active ? (
                  <span aria-hidden className="text-[0.65rem] font-semibold">
                    Selected
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
