import { computed, type MaybeRefOrGetter, toValue } from "vue";
import {
  type FlowEngineInput,
  type FlowRecommendation,
  type FlowResolution,
  type FlowStage,
  resolveFlowRecommendations,
} from "~/constants/flow-engine";

/**
 * Reactive interface around the global flow recommendation engine.
 *
 * @param input Reactive or static flow-engine input.
 * @returns Computed primary action, recommendations, stage, and next-step label.
 */
export function useFlowEngine(input: MaybeRefOrGetter<FlowEngineInput>) {
  const resolution = computed<FlowResolution>(() => resolveFlowRecommendations(toValue(input)));

  const primaryAction = computed<FlowRecommendation>(() => resolution.value.primaryAction);
  const recommendedActions = computed<readonly FlowRecommendation[]>(
    () => resolution.value.recommendedActions,
  );
  const nextStepLabel = computed<string>(() => resolution.value.nextStepLabel);
  const flowStage = computed<FlowStage>(() => resolution.value.flowStage);

  return {
    primaryAction,
    recommendedActions,
    nextStepLabel,
    flowStage,
  };
}
