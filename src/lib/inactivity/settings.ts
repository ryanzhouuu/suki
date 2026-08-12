export const DEFAULT_AUTO_PAUSE_DAYS = 30;
export const DEFAULT_DROP_PROMPT_DAYS = 30;
export const MIN_INACTIVITY_DAYS = 7;
export const MAX_INACTIVITY_DAYS = 365;

export function parseInactivityDays(
  value: FormDataEntryValue | null,
): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const days = Number(value);
  if (days < MIN_INACTIVITY_DAYS || days > MAX_INACTIVITY_DAYS) return null;

  return days;
}
