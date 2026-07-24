import { isRecord } from "@bao/shared/utils/type-guards";

export type ApiGamificationAward = {
  readonly xpAwarded: number;
  readonly reason: string;
};

/**
 * Reads optional gamification award payloads attached to mutating API responses.
 */
export function readApiGamificationAward(payload: unknown): ApiGamificationAward | null {
  if (!isRecord(payload)) {
    return null;
  }
  const gamification = payload.gamification;
  if (!isRecord(gamification)) {
    return null;
  }
  const xpAwarded = gamification.xpAwarded;
  const reason = gamification.reason;
  if (typeof xpAwarded !== "number" || typeof reason !== "string") {
    return null;
  }
  if (!(Number.isFinite(xpAwarded) && xpAwarded > 0)) {
    return null;
  }
  return { xpAwarded, reason };
}
