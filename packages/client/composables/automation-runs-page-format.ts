/**
 * Display formatters for the automation runs list table.
 */
import type { AutomationRunStatus, AutomationRunType } from "@bao/shared/constants/automation";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { Composer } from "vue-i18n";
import { formatDateWithLocale } from "~/utils/locale-format";

const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

type Translate = Composer["t"];

export function createAutomationRunsFormatters(
  t: Translate,
  resolveLocale: () => Parameters<typeof formatDateWithLocale>[1],
  resolveFallbackLocale: () => Parameters<typeof formatDateWithLocale>[2],
  notAvailableValue: () => string,
) {
  const formatDate = (value: string): string =>
    formatDateWithLocale(value, resolveLocale(), resolveFallbackLocale(), DATE_FORMAT_OPTIONS) ??
    value;

  const formatRunType = (runType: AutomationRunType): string =>
    t(`automation.runs.typeOptions.${runType}`);

  const formatRunStatus = (runStatus: AutomationRunStatus): string =>
    t(`automation.runs.statusOptions.${runStatus}`);

  const formatRunProgress = (run: RpaRunExecutionEnvelope): string => {
    if (typeof run.progress === "number" && Number.isFinite(run.progress)) {
      return `${Math.max(0, Math.min(100, Math.round(run.progress)))}%`;
    }
    return notAvailableValue();
  };

  return { formatDate, formatRunType, formatRunStatus, formatRunProgress };
}
