"use server";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import {
  FINGERPRINT_TRAIT_IDS,
  FINGERPRINT_VERSION,
} from "@/lib/fingerprint/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVENT_TYPES_BY_KIND = {
  viewed: USER_EVENT_TYPES.tasteFingerprintViewed,
  evidence_opened: USER_EVENT_TYPES.tasteFingerprintEvidenceOpened,
} as const;

export type TasteFingerprintEventKind = keyof typeof EVENT_TYPES_BY_KIND;

export type TasteFingerprintEventInput = {
  eventKind: string;
  fingerprintVersion: string;
  targetProfileUserId: string;
  traitId?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function invalidInput(): never {
  throw new Error("Invalid taste fingerprint analytics event.");
}

function validateEvent(input: unknown) {
  if (!isRecord(input)) return invalidInput();

  const eventKind = input.eventKind;
  const eventType =
    typeof eventKind === "string"
      ? EVENT_TYPES_BY_KIND[eventKind as TasteFingerprintEventKind]
      : undefined;
  if (!eventType) return invalidInput();

  if (input.fingerprintVersion !== FINGERPRINT_VERSION) return invalidInput();

  const targetProfileUserId = input.targetProfileUserId;
  if (
    typeof targetProfileUserId !== "string" ||
    !UUID_PATTERN.test(targetProfileUserId)
  ) {
    return invalidInput();
  }

  const rawTraitId = input.traitId;
  const traitId = rawTraitId === undefined || rawTraitId === null ? undefined : rawTraitId;
  if (
    traitId !== undefined &&
    (typeof traitId !== "string" ||
      !(FINGERPRINT_TRAIT_IDS as readonly string[]).includes(traitId))
  ) {
    return invalidInput();
  }

  if (eventKind === "evidence_opened" && traitId === undefined) {
    return invalidInput();
  }
  if (eventKind === "viewed" && traitId !== undefined) {
    return invalidInput();
  }

  return { eventType, targetProfileUserId, traitId };
}

export async function logTasteFingerprintEvent(
  input: TasteFingerprintEventInput,
): Promise<void> {
  const user = await requireAuthUser();
  const { eventType, targetProfileUserId, traitId } = validateEvent(input);

  const metadata: {
    fingerprintVersion: typeof FINGERPRINT_VERSION;
    traitId?: string;
    isOwnProfile: boolean;
  } = {
    fingerprintVersion: FINGERPRINT_VERSION,
    isOwnProfile: user.id === targetProfileUserId,
  };

  if (traitId !== undefined) metadata.traitId = traitId;

  try {
    await logUserEvent(user.id, eventType, { metadata });
  } catch {
    // Analytics must never affect the profile experience.
  }
}
