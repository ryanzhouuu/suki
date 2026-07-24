import { isValidTimeZone } from "@/lib/profiles/timezone";

export const DIGEST_METADATA_LAUNCH_DATE = "2026-07-27";

export type DigestWindow = {
  weekStart: string;
  weekEnd: string;
  startUtc: string;
  endUtc: string;
  timezone: string;
};

type DateParts = { year: number; month: number; day: number };

function dateParts(date: Date, timezone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function addCalendarDays(parts: DateParts, days: number): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function isoDate(parts: DateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function localMidnightUtc(parts: DateParts, timezone: string): Date {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day);
  let guess = desired;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      Number(formatted.find((part) => part.type === type)?.value);
    const actualAsUtc = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      read("hour"),
      read("minute"),
      read("second"),
    );
    guess += desired - actualAsUtc;
  }
  return new Date(guess);
}

function parseIsoDate(value: string): DateParts {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

export function utcRangeForLocalDates(
  weekStart: string,
  weekEnd: string,
  timezone: string,
) {
  const safeTimezone = isValidTimeZone(timezone) ? timezone : "UTC";
  return {
    startUtc: localMidnightUtc(
      parseIsoDate(weekStart),
      safeTimezone,
    ).toISOString(),
    endUtc: localMidnightUtc(parseIsoDate(weekEnd), safeTimezone).toISOString(),
  };
}

export function getLatestCompletedWeek(
  now: Date,
  requestedTimezone: string | null | undefined,
): DigestWindow {
  const timezone =
    requestedTimezone && isValidTimeZone(requestedTimezone)
      ? requestedTimezone
      : "UTC";
  const today = dateParts(now, timezone);
  const dayOfWeek = new Date(
    Date.UTC(today.year, today.month - 1, today.day),
  ).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekEndParts = addCalendarDays(today, -daysSinceMonday);
  const weekStartParts = addCalendarDays(weekEndParts, -7);

  return {
    weekStart: isoDate(weekStartParts),
    weekEnd: isoDate(weekEndParts),
    startUtc: localMidnightUtc(weekStartParts, timezone).toISOString(),
    endUtc: localMidnightUtc(weekEndParts, timezone).toISOString(),
    timezone,
  };
}

export function isDigestWindowEligible(window: DigestWindow): boolean {
  return window.weekStart >= DIGEST_METADATA_LAUNCH_DATE;
}
