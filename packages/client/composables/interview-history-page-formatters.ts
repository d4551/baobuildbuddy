import type { useI18n } from "vue-i18n";
import { formatDateWithLocale } from "~/utils/locale-format";
import { parseInterviewHistoryDurationMinutes } from "./interview-history-page-state";

export const createInterviewHistoryFormatters = (
  t: ReturnType<typeof useI18n>["t"],
  localeValue: () => unknown,
  fallbackLocaleValue: () => unknown,
) => {
  const formatDate = (value: string | undefined): string => {
    if (!value || value.length === 0) {
      return t("interviewHistory.notAvailable");
    }

    const formattedDate = formatDateWithLocale(value, localeValue(), fallbackLocaleValue(), {
      dateStyle: "medium",
    });
    return formattedDate ?? t("interviewHistory.notAvailable");
  };

  const formatDuration = (value: number | string | null): string => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return t("interviewHistory.minutesLabel", { count: value });
    }

    if (typeof value === "string") {
      const parsedMinutes = parseInterviewHistoryDurationMinutes(value);
      if (parsedMinutes !== null) {
        return t("interviewHistory.minutesLabel", { count: parsedMinutes });
      }
    }

    return t("interviewHistory.notAvailable");
  };

  const formatScore = (value: number | undefined): string =>
    Number.isFinite(value ?? Number.NaN) ? `${value}%` : t("interviewHistory.notAvailable");

  const questionScoreText = (score: number | undefined): number =>
    Number.isFinite(score ?? Number.NaN) ? (score ?? 0) : 0;

  return {
    formatDate,
    formatDuration,
    formatScore,
    questionScoreText,
  };
};

export const createInterviewHistoryScoreState = () => {
  const {
    getScoreBadgeClass: scoreBadgeClass,
    getScoreColorClass,
    getTimelineLineClass,
  } = useScoreColor();

  return {
    scoreBadgeClass,
    getScoreColorClass,
    getTimelineLineClass,
  };
};
