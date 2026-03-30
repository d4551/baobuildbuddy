import type { InterviewMode } from "@bao/shared";
import type { ComposerTranslation } from "vue-i18n";
import type { Ref } from "vue";
import { formatDateWithLocale } from "~/utils/locale-format";

type InterviewHubPresentationInput = {
  fallbackLocale: Ref<unknown>;
  locale: Ref<string>;
};

export function createInterviewHubPresentation(
  input: InterviewHubPresentationInput,
  t: ComposerTranslation,
) {
  return {
    experienceLabel(level: string): string {
      if (level === "entry") return t("interviewHub.experience.entry");
      if (level === "mid") return t("interviewHub.experience.mid");
      if (level === "senior") return t("interviewHub.experience.senior");
      if (level === "lead") return t("interviewHub.experience.lead");
      return level;
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
      return ready ? "badge-success" : "badge-ghost";
    },
    questionCountLabel(count: number): string {
      if (count === 3) return t("interviewHub.questionCount.quick");
      if (count === 5) return t("interviewHub.questionCount.standard");
      if (count === 8) return t("interviewHub.questionCount.deep");
      return String(count);
    },
    recentSessionPageAria(page: number): string {
      return t("interviewHub.recent.pagination.pageAria", { page });
    },
  };
}
