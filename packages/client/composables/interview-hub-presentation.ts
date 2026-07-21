import type { InterviewMode } from "@bao/shared/types/interview";
import type { Ref } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import {
  BADGE_GHOST_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
} from "~/constants/layout-badges";
import { formatDateWithLocale } from "~/utils/locale-format";

type InterviewHubPresentationInput = {
  fallbackLocale: Ref<unknown>;
  locale: Ref<string>;
};

const EXPERIENCE_LABEL_KEYS = {
  entry: "interviewHub.experience.entry",
  lead: "interviewHub.experience.lead",
  mid: "interviewHub.experience.mid",
  senior: "interviewHub.experience.senior",
} as const;

const QUESTION_COUNT_LABEL_KEYS = {
  3: "interviewHub.questionCount.quick",
  5: "interviewHub.questionCount.standard",
  8: "interviewHub.questionCount.deep",
} as const;

export function createInterviewHubPresentation(
  input: InterviewHubPresentationInput,
  t: ComposerTranslation,
) {
  return {
    experienceLabel(level: string): string {
      const key = EXPERIENCE_LABEL_KEYS[level as keyof typeof EXPERIENCE_LABEL_KEYS];
      return key ? t(key) : level;
    },
    formatSessionDate(value: string | undefined): string {
      if (!(typeof value === "string" && value.length > 0)) {
        return t("interviewHub.recent.notAvailable");
      }
      const formattedDate = formatDateWithLocale(
        value,
        input.locale.value,
        input.fallbackLocale.value,
        { dateStyle: "medium" },
      );
      return formattedDate ?? t("interviewHub.recent.notAvailable");
    },
    interviewConfigPageAria(page: number): string {
      return t("interviewHub.config.pagination.pageAria", { page });
    },
    modeLabel(mode: InterviewMode | undefined): string {
      return mode === "job" ? t("interviewHub.mode.job") : t("interviewHub.mode.studio");
    },
    prepStatusBadgeClass(ready: boolean): string {
      return ready ? BADGE_SUCCESS_SM_CLASS : BADGE_GHOST_SM_CLASS;
    },
    questionCountLabel(count: number): string {
      const key = QUESTION_COUNT_LABEL_KEYS[count as keyof typeof QUESTION_COUNT_LABEL_KEYS];
      return key ? t(key) : String(count);
    },
    recentSessionPageAria(page: number): string {
      return t("interviewHub.recent.pagination.pageAria", { page });
    },
  };
}
