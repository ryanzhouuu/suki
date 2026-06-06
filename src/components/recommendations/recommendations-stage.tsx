import type { ReactNode } from "react";

export const RECOMMENDATIONS_STAGE_GUTTER_CLASS = "w-0 shrink-0 sm:w-12";

type RecommendationsStageProps = {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
};

/** Keeps query cards, hints, and carousel cards on the same horizontal track. */
export function RecommendationsStage({
  children,
  leading,
  trailing,
}: RecommendationsStageProps) {
  return (
    <div className="flex items-stretch gap-2 sm:gap-4">
      <div
        className={`${RECOMMENDATIONS_STAGE_GUTTER_CLASS} relative z-20 flex items-center justify-center`}
      >
        {leading}
      </div>
      <div className="relative z-0 min-w-0 flex-1 overflow-visible">{children}</div>
      <div
        className={`${RECOMMENDATIONS_STAGE_GUTTER_CLASS} relative z-20 flex items-center justify-center`}
      >
        {trailing}
      </div>
    </div>
  );
}
