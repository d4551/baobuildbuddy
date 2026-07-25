import {
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
} from "@bao/shared/constants/score-thresholds";

export type ScoreLevel = "pass" | "warning" | "developing" | "unknown";

function resolveScoreLevel(score: number | undefined): ScoreLevel {
  if (!Number.isFinite(score ?? Number.NaN)) return "unknown";
  const s = score ?? 0;
  if (s >= SCORE_PASS_THRESHOLD) return "pass";
  if (s >= SCORE_WARNING_THRESHOLD) return "warning";
  return "developing";
}

const LEVEL_TEXT_MAP: Record<ScoreLevel, string> = {
  pass: "text-success",
  warning: "text-warning",
  developing: "text-error",
  unknown: "text-warning",
};

const LEVEL_BADGE_MAP: Record<ScoreLevel, string> = {
  pass: "badge-success",
  warning: "badge-warning",
  developing: "badge-error",
  unknown: "badge-warning",
};

const LEVEL_PROGRESS_MAP: Record<ScoreLevel, string> = {
  pass: "progress-success",
  warning: "progress-warning",
  developing: "progress-error",
  unknown: "progress-warning",
};

const LEVEL_BORDER_MAP: Record<ScoreLevel, string> = {
  pass: "border-success",
  warning: "border-warning",
  developing: "border-error",
  unknown: "border-warning",
};

const LEVEL_BG_MAP: Record<ScoreLevel, string> = {
  pass: "bg-success",
  warning: "bg-warning",
  developing: "bg-error",
  unknown: "bg-warning",
};

const LEVEL_ALERT_MAP: Record<ScoreLevel, string> = {
  pass: "alert-success",
  warning: "alert-warning",
  developing: "alert-error",
  unknown: "alert-warning",
};

export function useScoreColor() {
  function getScoreColorClass(score: number | undefined): string {
    return LEVEL_TEXT_MAP[resolveScoreLevel(score)];
  }

  function getScoreTextClass(score: number | undefined): string {
    return getScoreColorClass(score);
  }

  function getScoreBadgeClass(score: number | undefined): string {
    return LEVEL_BADGE_MAP[resolveScoreLevel(score)];
  }

  function getScoreProgressClass(score: number | undefined): string {
    return LEVEL_PROGRESS_MAP[resolveScoreLevel(score)];
  }

  function getScoreBorderClass(score: number | undefined): string {
    return LEVEL_BORDER_MAP[resolveScoreLevel(score)];
  }

  function getTimelineLineClass(score: number | undefined): string {
    return LEVEL_BG_MAP[resolveScoreLevel(score)];
  }

  function getAlertClass(score: number | undefined): string {
    return LEVEL_ALERT_MAP[resolveScoreLevel(score)];
  }

  return {
    getScoreColorClass,
    getScoreTextClass,
    getScoreBadgeClass,
    getScoreProgressClass,
    getScoreBorderClass,
    getTimelineLineClass,
    getAlertClass,
  };
}
