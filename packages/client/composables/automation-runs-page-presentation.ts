import {
  AUTOMATION_RUN_STATUSES,
  type AutomationRunStatus,
  type AutomationRunType,
} from "@bao/shared/constants/automation";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { isRecord } from "@bao/shared/utils/type-guards";
import { computed, type Ref } from "vue";
import type { useI18n } from "vue-i18n";
import { isLiveAutomationRun } from "~/composables/automation-runs-page-merge";
import { PERCENT_MAX } from "~/constants/numeric-ui";
import { formatDateWithLocale } from "~/utils/locale-format";

type Translate = ReturnType<typeof useI18n>["t"];

const [
  RUN_STATUS_PENDING,
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCESS,
  RUN_STATUS_ERROR,
  RUN_STATUS_CANCELLED,
] = AUTOMATION_RUN_STATUSES;

const RUN_STATUS_ORDER: Record<AutomationRunStatus, number> = {
  [RUN_STATUS_RUNNING]: 0,
  [RUN_STATUS_PENDING]: 1,
  [RUN_STATUS_ERROR]: 2,
  [RUN_STATUS_CANCELLED]: 3,
  [RUN_STATUS_SUCCESS]: 4,
};

const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

function compareRunsForSort(left: RpaRunExecutionEnvelope, right: RpaRunExecutionEnvelope): number {
  const statusDiff = RUN_STATUS_ORDER[left.status] - RUN_STATUS_ORDER[right.status];
  if (statusDiff !== 0) {
    return statusDiff;
  }
  const createdDiff = Date.parse(right.createdAt) - Date.parse(left.createdAt);
  if (Number.isFinite(createdDiff) && createdDiff !== 0) {
    return createdDiff;
  }
  return left.id.localeCompare(right.id);
}

export function createAutomationRunsPagePresentation(
  mergedRuns: Ref<RpaRunExecutionEnvelope[]>,
  t: Translate,
  locale: Readonly<{ value: unknown }>,
  fallbackLocale: Readonly<{ value: unknown }>,
) {
  const notAvailableValue = computed(() => t("automation.runs.list.notAvailable"));

  const sortedRuns = computed<RpaRunExecutionEnvelope[]>(() =>
    [...mergedRuns.value].sort(compareRunsForSort),
  );

  const formatDate = (value: string): string => {
    const formattedDate = formatDateWithLocale(
      value,
      locale.value,
      fallbackLocale.value,
      DATE_FORMAT_OPTIONS,
    );
    return formattedDate ?? value;
  };

  const formatRunType = (runType: AutomationRunType): string =>
    t(`automation.runs.typeOptions.${runType}`);
  const formatRunStatus = (runStatus: AutomationRunStatus): string =>
    t(`automation.runs.statusOptions.${runStatus}`);

  const resolveJobIdLabel = (run: RpaRunExecutionEnvelope): string | undefined =>
    typeof run.jobId === "string" && run.jobId.trim().length > 0 ? run.jobId : undefined;

  const resolveInputLabel = (input: unknown): string | undefined => {
    if (!isRecord(input)) {
      return undefined;
    }
    if (typeof input.jobUrl === "string" && input.jobUrl.trim().length > 0) {
      return URL.canParse(input.jobUrl) ? new URL(input.jobUrl).hostname : input.jobUrl;
    }
    if (typeof input.target === "string" && input.target.trim().length > 0) {
      return input.target;
    }
    return undefined;
  };

  const resolveOutputLabel = (output: unknown): string | undefined => {
    if (!isRecord(output) || typeof output.scraped !== "number") {
      return undefined;
    }
    return String(output.scraped);
  };

  const formatRunJobLabel = (run: RpaRunExecutionEnvelope): string =>
    resolveJobIdLabel(run) ??
    resolveInputLabel(run.input) ??
    resolveOutputLabel(run.output) ??
    t("automation.runs.emptyJobId");

  const formatRunProgress = (run: RpaRunExecutionEnvelope): string => {
    if (typeof run.progress === "number" && Number.isFinite(run.progress)) {
      return `${Math.max(0, Math.min(PERCENT_MAX, Math.round(run.progress)))}%`;
    }
    return notAvailableValue.value;
  };

  const resolveRowClass = (run: RpaRunExecutionEnvelope): Record<string, boolean> => ({
    "bg-base-200": isLiveAutomationRun(run),
  });

  return {
    sortedRuns,
    formatDate,
    formatRunType,
    formatRunStatus,
    formatRunJobLabel,
    formatRunProgress,
    resolveRowClass,
  };
}
