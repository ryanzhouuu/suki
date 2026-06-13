"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";

const GROUP_PARAM = "group";
const GROUP_VALUE = "series";

export function GroupToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const grouped = searchParams.get(GROUP_PARAM) === GROUP_VALUE;

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (grouped) {
      params.delete(GROUP_PARAM);
    } else {
      params.set(GROUP_PARAM, GROUP_VALUE);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor="library-group" className="mb-0 shrink-0">
        Group by show
      </Label>
      <button
        type="button"
        id="library-group"
        role="switch"
        aria-checked={grouped}
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          grouped ? "bg-accent" : "bg-surface-2"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-paper shadow transition-transform ${
            grouped ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
