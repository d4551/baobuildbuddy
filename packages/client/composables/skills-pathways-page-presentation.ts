import { getGamificationPathwayIcon } from "@bao/shared/constants/gamification-icons";
import type {
  CareerPathway,
  ReadinessAssessment,
  SkillReadinessFeedbackId,
} from "@bao/shared/types/skill-mapping";
import {
  READINESS_CATEGORY_KEYS,
  READINESS_CATEGORY_LABEL_KEYS,
  type ReadinessCategoryKey,
  type ReadinessCategoryStat,
  type ReadinessImprovementItem,
  type ReadinessNextStepItem,
} from "~/composables/skills-pathways-page-contracts";
import {
  SKILLS_READINESS_THRESHOLD_HIGH,
  SKILLS_READINESS_THRESHOLD_MEDIUM,
} from "~/constants/skills";
import { PROGRESS_BAR_VARIANT_CLASS } from "~/constants/layout-tokens";
import { BADGE_VARIANT_CLASS } from "~/constants/layout-badges";

interface SkillsPathwaysPresentationOptions {
  readonly t: (key: string, params?: Record<string, string | number>) => string;
}

const getReadinessColor = (percentage: number): string => {
  if (percentage >= SKILLS_READINESS_THRESHOLD_HIGH) return PROGRESS_BAR_VARIANT_CLASS.success;
  if (percentage >= SKILLS_READINESS_THRESHOLD_MEDIUM) return PROGRESS_BAR_VARIANT_CLASS.warning;
  return PROGRESS_BAR_VARIANT_CLASS.error;
};

const getReadinessBadgeColor = (percentage: number): string => {
  if (percentage >= SKILLS_READINESS_THRESHOLD_HIGH) return BADGE_VARIANT_CLASS.success;
  if (percentage >= SKILLS_READINESS_THRESHOLD_MEDIUM) return BADGE_VARIANT_CLASS.warning;
  return BADGE_VARIANT_CLASS.error;
};

const sortPathways = (pathways: readonly CareerPathway[]): readonly CareerPathway[] =>
  [...pathways].sort((left, right) => right.matchScore - left.matchScore);

const createReadinessCategories = (
  readinessAssessment: ReadinessAssessment | null,
): readonly ReadinessCategoryStat[] => {
  if (!readinessAssessment) {
    return [];
  }

  return READINESS_CATEGORY_KEYS.map((key) => ({
    key,
    score: readinessAssessment.categories[key].score,
    feedbackId: readinessAssessment.categories[key].feedbackId,
  }));
};

const createSkillsPathwaysCopy = (t: SkillsPathwaysPresentationOptions["t"]) => {
  const getCategoryLabel = (key: ReadinessCategoryKey): string =>
    t(READINESS_CATEGORY_LABEL_KEYS[key]);
  const getCategoryFeedbackLabel = (
    categoryKey: ReadinessCategoryKey,
    feedbackId: SkillReadinessFeedbackId,
  ): string =>
    t(`skillsPathwaysPage.readiness.feedback.${feedbackId}`, {
      category: getCategoryLabel(categoryKey),
    });

  const getReadinessImprovementLabel = (item: ReadinessImprovementItem): string =>
    t(`skillsPathwaysPage.readiness.improvements.${item}`);

  const getReadinessNextStepLabel = (item: ReadinessNextStepItem): string =>
    t(`skillsPathwaysPage.readiness.nextStepItems.${item}`);

  const getPathwayIcon = (pathwayId: string): string => getGamificationPathwayIcon(pathwayId);
  return {
    getCategoryFeedbackLabel,
    getCategoryLabel,
    getPathwayIcon,
    getReadinessImprovementLabel,
    getReadinessNextStepLabel,
  };
};

export const createSkillsPathwaysPresentation = ({ t }: SkillsPathwaysPresentationOptions) => {
  const copy = createSkillsPathwaysCopy(t);

  return {
    createReadinessCategories,
    getCategoryFeedbackLabel: copy.getCategoryFeedbackLabel,
    getCategoryLabel: copy.getCategoryLabel,
    getPathwayIcon: copy.getPathwayIcon,
    getReadinessBadgeColor,
    getReadinessColor,
    getReadinessImprovementLabel: copy.getReadinessImprovementLabel,
    getReadinessNextStepLabel: copy.getReadinessNextStepLabel,
    sortPathways,
  };
};
