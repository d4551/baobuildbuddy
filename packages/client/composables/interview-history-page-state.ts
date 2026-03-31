import { DECIMAL_RADIX } from "@bao/shared/constants/client-config";
import type { LocationQueryValue } from "vue-router";
import type {
  InterviewHistoryPageState,
  InterviewHistoryView,
} from "./interview-history-page-contracts";

export const normalizeInterviewHistoryQuerySession = (
  value: LocationQueryValue | readonly LocationQueryValue[] | undefined,
): string | null => {
  if (Array.isArray(value)) {
    const [first] = value.filter((entry): entry is string => typeof entry === "string");
    return typeof first === "string" && first.trim().length > 0 ? first : null;
  }

  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

export const parseInterviewHistoryDurationMinutes = (value: string): number | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const durationParts = [...normalized.matchAll(/(\d+)\s*([hms])/gi)];
  if (durationParts.length === 0) {
    return null;
  }

  let totalMinutes = 0;
  for (const [, amountText, unitText] of durationParts) {
    if (amountText === undefined || unitText === undefined) {
      continue;
    }

    const amount = Number.parseInt(amountText, DECIMAL_RADIX);
    if (!Number.isFinite(amount)) {
      continue;
    }

    if (unitText === "h") {
      totalMinutes += amount * 60;
      continue;
    }

    if (unitText === "m") {
      totalMinutes += amount;
      continue;
    }

    if (unitText === "s") {
      totalMinutes += amount / 60;
    }
  }

  return totalMinutes > 0 ? Math.round(totalMinutes) : null;
};

export const createInterviewHistoryPageState = (): InterviewHistoryPageState => ({
  selectedSessionId: ref<string | null>(null),
  selectedSession: ref(null),
  studioFilter: ref(""),
  historyView: ref<InterviewHistoryView>("table"),
  detailLoading: ref(false),
  detailError: ref(""),
});
