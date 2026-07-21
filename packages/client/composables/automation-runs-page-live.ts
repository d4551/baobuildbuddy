/**
 * Live WebSocket subscription wiring for the automation runs list.
 */
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { Ref } from "vue";
import { onBeforeUnmount, watch } from "vue";
import { isLiveRun, mergeRunWithEvent } from "~/composables/automation-runs-page-merge";
import type { useAutomation } from "~/composables/useAutomation";

type SubscribeToRun = ReturnType<typeof useAutomation>["subscribeToRun"];
/** AsyncData/ref runs list — value may be undefined while pending. */
type RunsList = Ref<RpaRunExecutionEnvelope[] | null | undefined>;

export function useAutomationRunsLiveSync(
  runs: RunsList,
  subscribeToRun: SubscribeToRun,
  liveRunById: Ref<Record<string, RpaRunExecutionEnvelope>>,
): void {
  const activeSubscriptions = new Map<string, () => void>();

  const unsubscribeRun = (runId: string): void => {
    const unsubscribe = activeSubscriptions.get(runId);
    if (!unsubscribe) {
      return;
    }
    unsubscribe();
    activeSubscriptions.delete(runId);
  };

  const clearSubscriptions = (): void => {
    for (const [runId, unsubscribe] of activeSubscriptions.entries()) {
      unsubscribe();
      activeSubscriptions.delete(runId);
    }
  };

  const subscribeRun = (run: RpaRunExecutionEnvelope): void => {
    if (!isLiveRun(run) || activeSubscriptions.has(run.id)) {
      return;
    }
    const unsubscribe = subscribeToRun(run.id, (event) => {
      const currentRun =
        liveRunById.value[event.runId] || runs.value?.find((item) => item.id === event.runId);
      if (!currentRun) {
        return;
      }
      const mergedRun = mergeRunWithEvent(currentRun, event);
      liveRunById.value = {
        ...liveRunById.value,
        [event.runId]: mergedRun,
      };
      if (!isLiveRun(mergedRun)) {
        unsubscribeRun(event.runId);
      }
    });
    activeSubscriptions.set(run.id, unsubscribe);
  };

  const syncSubscriptions = (nextRuns: readonly RpaRunExecutionEnvelope[]): void => {
    const liveRunIds = new Set(nextRuns.filter((run) => isLiveRun(run)).map((run) => run.id));
    for (const runId of activeSubscriptions.keys()) {
      if (!liveRunIds.has(runId)) {
        unsubscribeRun(runId);
      }
    }
    for (const run of nextRuns) {
      subscribeRun(run);
    }
  };

  watch(
    () => (runs.value || []).map((run) => liveRunById.value[run.id] || run),
    (nextRuns) => {
      syncSubscriptions(nextRuns);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    clearSubscriptions();
  });
}
