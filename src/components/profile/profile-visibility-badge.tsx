import {
  PROFILE_VISIBILITY_LABELS,
  type ProfileVisibility,
} from "@/lib/constants";

type ProfileVisibilityBadgeProps = {
  visibility: ProfileVisibility;
};

export function ProfileVisibilityBadge({
  visibility,
}: ProfileVisibilityBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          visibility === "public"
            ? "bg-success"
            : visibility === "friends_only"
              ? "bg-accent"
              : "bg-faint"
        }`}
      />
      {PROFILE_VISIBILITY_LABELS[visibility]}
    </span>
  );
}
