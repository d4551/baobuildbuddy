import type { RpaRunEvent, RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { computed, type Ref, ref, watch } from "vue";
import {
  isLiveAutomationRun,
  mergeAutomationRunWithEvent,
} from "~/composables/automation-runs-page-merge";

type SubscribeToRun = (runId: string, onEvent: (event: RpaRunEvent) => void) => () => void;

export function createAutomationRunsLiveState(
  runs: Ref<RpaRunExecutionEnvelope[] | null | undefined>,
  subscribeToRun: SubscribeToRun,
) {
  const activeSubscriptions = new Map<string, () => void>();
  const liveRunById = ref<Record<string, RpaRunExecutionEnvelope>>({});

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
    if (!isLiveAutomationRun(run) || activeSubscriptions.has(run.id)) {
      return;
    }
    const unsubscribe = subscribeToRun(run.id, (event) => {
      const currentRun =
        liveRunById.value[event.runId] ||
        runs.value?.find((candidate) => candidate.id === event.runId);
      if (!currentRun) {
        return;
      }
      const mergedRun = mergeAutomationRunWithEvent(currentRun, event);
      liveRunById.value = {
        ...liveRunById.value,
        [event.runId]: mergedRun,
      };
      if (!isLiveAutomationRun(mergedRun)) {
        unsubscribeRun(event.runId);
      }
    });
    activeSubscriptions.set(run.id, unsubscribe);
  };

  const mergedRuns = computed<RpaRunExecutionEnvelope[]>(() => {
    const rows: RpaRunExecutionEnvelope[] = [];
    for (const run of runs.value || []) {
      rows.push(liveRunById.value[run.id] || run);
    }
    return rows;
  });

  watch(
    mergedRuns,
    (nextRuns) => {
      const liveRunIds = new Set<string>();
      for (const nextRun of nextRuns) {
        if (isLiveAutomationRun(nextRun)) {
          liveRunIds.add(nextRun.id);
        }
      }
      for (const runId of activeSubscriptions.keys()) {
        if (!liveRunIds.has(runId)) {
          unsubscribeRun(runId);
        }
      }
      for (const nextRun of nextRuns) {
        subscribeRun(nextRun);
      }
    },
    { immediate: true },
  );

  return {
    mergedRuns,
    clearSubscriptions,
  };
}
