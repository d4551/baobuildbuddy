import {
  isAutomationJobScrapeTarget,
  automationScrapeTargetToPortalId,
  type AutomationScrapeTarget,
} from "@bao/shared/constants/automation";
import type { Ref } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import type { Router } from "vue-router";
import type { NuxtApp } from "#app";
import { settlePromise } from "~/composables/async-flow";
import { toIsoTimestamp } from "~/composables/schedule-timestamp";
import { useApi } from "~/composables/useApi";
import type { AutomationRunEnvelope, ScrapePendingAction } from "~/types/automation-scraper";
import { getErrorMessage } from "~/utils/errors";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { isFailedScrapeRun, readScrapeOutputErrors } from "~/utils/scrape-run-output";

async function syncDirectScraperCatalog(target: AutomationScrapeTarget): Promise<void> {
  const api = useApi();
  if (target === "studios") {
    await api.scraper.studios.post();
    return;
  }
  if (!isAutomationJobScrapeTarget(target)) {
    return;
  }
  const portalId = automationScrapeTargetToPortalId(target);
  const portalRoute = api.scraper.jobs[portalId];
  if (portalRoute && typeof portalRoute.post === "function") {
    await portalRoute.post();
  }
}

type AutomationScraperActionsInput = {
  awardForAction: (action: "scraperStudios" | "scraperJobs") => Promise<{
    awarded: boolean;
    amount: number;
  }>;
  lastRunAt: Record<AutomationScrapeTarget, string | null>;
  latestRuns: Record<AutomationScrapeTarget, AutomationRunEnvelope | null>;
  pendingAction: Ref<ScrapePendingAction | null>;
  refreshCapabilityAudit: () => Promise<unknown>;
  refreshScraperJobs: () => Promise<unknown>;
  runMessages: Record<AutomationScrapeTarget, string>;
  runStates: Record<AutomationScrapeTarget, "idle" | "running" | "success" | "error">;
  scheduleScrape: (input: {
    target: AutomationScrapeTarget;
    runAt: string;
  }) => Promise<AutomationRunEnvelope>;
  scheduledRunAt: Record<AutomationScrapeTarget, string>;
  triggerScrape: (input: { target: AutomationScrapeTarget }) => Promise<AutomationRunEnvelope>;
};

type AutomationScraperRunStateStore = Pick<
  AutomationScraperActionsInput,
  "latestRuns" | "pendingAction" | "runMessages" | "runStates"
>;

type AutomationScraperSuccessStore = Pick<
  AutomationScraperActionsInput,
  "lastRunAt" | "latestRuns" | "runMessages" | "runStates"
>;

type AutomationScraperRefreshInput = Pick<
  AutomationScraperActionsInput,
  "refreshCapabilityAudit" | "refreshScraperJobs"
> & {
  target: AutomationScrapeTarget;
};

function createScheduleScrapeRun(input: AutomationScraperActionsInput, t: ComposerTranslation) {
  return async (target: AutomationScrapeTarget): Promise<void> => {
    const runAt = toIsoTimestamp(input.scheduledRunAt[target]);
    if (!runAt) {
      input.runStates[target] = "error";
      input.runMessages[target] = t("automation.scraper.schedule.invalidRunAt");
      return;
    }

    input.pendingAction.value = `${target}-schedule`;
    input.latestRuns[target] = null;
    const scheduleResult = await settlePromise(
      input.scheduleScrape({ target, runAt }),
      t("automation.scraper.errors.scheduleFailed"),
    );
    input.pendingAction.value = null;

    if (!scheduleResult.ok) {
      input.runStates[target] = "error";
      input.runMessages[target] = getErrorMessage(
        scheduleResult.error,
        t("automation.scraper.errors.scheduleFailed"),
      );
      return;
    }

    input.runStates[target] = "success";
    input.runMessages[target] = t("automation.scraper.schedule.createdMessage");
    input.latestRuns[target] = scheduleResult.value;
  };
}

function createRunScrapeTarget(
  input: AutomationScraperActionsInput,
  rewardResolver: ReturnType<typeof createPipelineRewardResolver>,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;
  const runStateStore = {
    lastRunAt: input.lastRunAt,
    latestRuns: input.latestRuns,
    pendingAction: input.pendingAction,
    runMessages: input.runMessages,
    runStates: input.runStates,
  };

  return async (target: AutomationScrapeTarget): Promise<void> => {
    const failureKey = resolveRunFailureKey(target);
    prepareManualRun(target, runStateStore);
    const runResult = await settlePromise(input.triggerScrape({ target }), t(failureKey));
    input.pendingAction.value = null;

    if (!runResult.ok) {
      applyRunFailure({ error: runResult.error, failureKey, target }, runStateStore, t);
      return;
    }

    const completedRun = runResult.value;
    // Dual fabric: RPA run + Eden scraper portal sync for catalog freshness.
    await settlePromise(syncDirectScraperCatalog(target), t(failureKey));
    await refreshManualRunArtifacts({
      refreshCapabilityAudit: input.refreshCapabilityAudit,
      refreshScraperJobs: input.refreshScraperJobs,
      target,
    });
    const scrapeFailed = isFailedScrapeRun({
      aborted: completedRun.aborted,
      exitCode: completedRun.exitCode,
      output: completedRun.output,
      timedOut: completedRun.timedOut,
    });
    const reward = scrapeFailed ? null : await rewardResolver(resolveRewardAction(target));
    applyRunSuccess({ completedRun, reward, target }, runStateStore, t);
    if (reward) {
      $toast.success(t(resolveRewardToastKey(target), { xp: reward }));
    }
  };
}

export function useAutomationScraperActions(
  input: AutomationScraperActionsInput,
  router: Router,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const rewardResolver = createPipelineRewardResolver(input.awardForAction, t);
  const scheduleScrapeRun = createScheduleScrapeRun(input, t);
  const runScrapeTarget = createRunScrapeTarget(input, rewardResolver, nuxtApp, t);

  function isPendingAction(target: AutomationScrapeTarget, action: "run" | "schedule"): boolean {
    return input.pendingAction.value === `${target}-${action}`;
  }

  async function startJobInterview(jobId: string): Promise<void> {
    await router.push(buildInterviewJobNavigation(jobId, "scraper"));
  }

  return {
    isPendingAction,
    runScrapeTarget,
    scheduleScrapeRun,
    startJobInterview,
  };
}

function resolveRunFailureKey(target: AutomationScrapeTarget): string {
  return target === "studios"
    ? "automation.scraper.errors.studioFailed"
    : "automation.scraper.errors.jobFailed";
}

function resolveRewardAction(target: AutomationScrapeTarget): "scraperStudios" | "scraperJobs" {
  return target === "studios" ? "scraperStudios" : "scraperJobs";
}

function resolveRewardToastKey(target: AutomationScrapeTarget): string {
  return target === "studios"
    ? "automation.scraper.toasts.studioReward"
    : "automation.scraper.toasts.jobReward";
}

function resolveCompletionMessageKey(target: AutomationScrapeTarget, hasReward: boolean): string {
  if (target === "studios") {
    return hasReward
      ? "automation.scraper.messages.studioCompletedWithXp"
      : "automation.scraper.messages.studioCompleted";
  }
  return hasReward
    ? "automation.scraper.messages.jobCompletedWithXp"
    : "automation.scraper.messages.jobCompleted";
}

function prepareManualRun(
  target: AutomationScrapeTarget,
  { latestRuns, pendingAction, runMessages, runStates }: AutomationScraperRunStateStore,
): void {
  runStates[target] = "running";
  runMessages[target] = "";
  latestRuns[target] = null;
  pendingAction.value = `${target}-run`;
}

function applyRunFailure(
  {
    error,
    failureKey,
    target,
  }: { error: unknown; failureKey: string; target: AutomationScrapeTarget },
  { runMessages, runStates }: Pick<AutomationScraperActionsInput, "runMessages" | "runStates">,
  t: ComposerTranslation,
): void {
  runStates[target] = "error";
  runMessages[target] = getErrorMessage(error, t(failureKey));
}

async function refreshManualRunArtifacts({
  refreshCapabilityAudit,
  refreshScraperJobs,
  target,
}: AutomationScraperRefreshInput): Promise<void> {
  if (target !== "studios") {
    await refreshScraperJobs();
  }
  await refreshCapabilityAudit();
}

function applyRunSuccess(
  {
    completedRun,
    reward,
    target,
  }: { completedRun: AutomationRunEnvelope; reward: number | null; target: AutomationScrapeTarget },
  { lastRunAt, latestRuns, runMessages, runStates }: AutomationScraperSuccessStore,
  t: ComposerTranslation,
): void {
  lastRunAt[target] = completedRun.completedAt ?? completedRun.updatedAt;
  latestRuns[target] = completedRun;

  const failed = isFailedScrapeRun({
    aborted: completedRun.aborted,
    exitCode: completedRun.exitCode,
    output: completedRun.output,
    timedOut: completedRun.timedOut,
  });
  if (failed) {
    runStates[target] = "error";
    const outputErrors = readScrapeOutputErrors(completedRun.output);
    const envelopeError = typeof completedRun.error === "string" ? completedRun.error : null;
    runMessages[target] = outputErrors[0] ?? envelopeError ?? t(resolveRunFailureKey(target));
    return;
  }

  runStates[target] = "success";
  const messageKey = resolveCompletionMessageKey(target, reward !== null);
  runMessages[target] = reward === null ? t(messageKey) : t(messageKey, { xp: reward });
}

function createPipelineRewardResolver(
  awardForAction: (action: "scraperStudios" | "scraperJobs") => Promise<{
    awarded: boolean;
    amount: number;
  }>,
  t: ComposerTranslation,
) {
  return async (action: "scraperStudios" | "scraperJobs"): Promise<number | null> => {
    const rewardResult = await settlePromise(
      awardForAction(action),
      t("automation.scraper.errors.rewardFailed"),
    );
    if (!rewardResult.ok) {
      return null;
    }
    return rewardResult.value.awarded ? rewardResult.value.amount : null;
  };
}
