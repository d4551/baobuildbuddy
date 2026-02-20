import {
  PIPELINE_GAMIFICATION_REASONS,
  PIPELINE_GAMIFICATION_XP,
  STATE_KEYS,
  type PipelineGamificationAction,
  type PipelineGamificationReason,
} from "@bao/shared";

type AwardedReasonState = Partial<Record<PipelineGamificationReason, true>>;

/**
 * Result returned when awarding XP for a pipeline action.
 */
export interface PipelineGamificationAwardResult {
  /** Canonical reason passed to the gamification API. */
  readonly reason: PipelineGamificationReason;
  /** XP amount associated with the action. */
  readonly amount: number;
  /** True only when XP was awarded in this call. */
  readonly awarded: boolean;
}

/**
 * Centralized XP award flow for end-to-end pipeline actions.
 * Awards each action once per client session to prevent duplicate farming.
 */
export function usePipelineGamification() {
  const { awardXP } = useGamification();
  const awardedReasons = useState<AwardedReasonState>(
    STATE_KEYS.PIPELINE_GAMIFICATION_AWARDED,
    () => ({}),
  );

  /**
   * Attempts to award XP for a pipeline action.
   *
   * @param action Canonical pipeline action.
   * @returns Award result with amount and reason metadata.
   */
  async function awardForAction(
    action: PipelineGamificationAction,
  ): Promise<PipelineGamificationAwardResult> {
    const reason = PIPELINE_GAMIFICATION_REASONS[action];
    const amount = PIPELINE_GAMIFICATION_XP[action];

    if (awardedReasons.value[reason]) {
      return {
        reason,
        amount,
        awarded: false,
      };
    }

    await awardXP(amount, reason);
    awardedReasons.value = {
      ...awardedReasons.value,
      [reason]: true,
    };

    return {
      reason,
      amount,
      awarded: true,
    };
  }

  return {
    awardForAction,
  };
}
