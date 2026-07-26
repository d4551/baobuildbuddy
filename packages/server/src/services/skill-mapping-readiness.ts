import {
  COUNT_FIFTY,
  COUNT_FIVE,
  COUNT_SEVENTY,
  COUNT_THREE,
  COUNT_TWENTY,
  PERCENT_MAX,
  RATIO_ONE_FIFTH,
  RATIO_ONE_QUARTER,
  RATIO_THREE_TENTHS,
} from "@bao/shared/constants/numeric";
import {
  SCORE_DEVELOPING_THRESHOLD,
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
} from "@bao/shared/constants/score-thresholds";
import type {
  ReadinessAssessment,
  RoleReadiness,
  SkillMapping,
  SkillReadinessFeedbackId,
  SkillReadinessImprovementId,
  SkillReadinessNextStepId,
} from "@bao/shared/types/skill-mapping";

export interface ReadinessJobTarget {
  readonly id: string;
  readonly title: string;
  readonly requirements: readonly string[];
  readonly technologies: readonly string[];
}

type ReadinessMetrics = {
  technicalSkills: SkillMapping[];
  softSkills: SkillMapping[];
  technicalScore: number;
  softSkillsScore: number;
  industryScore: number;
  portfolioScore: number;
  overallScore: number;
};

const buildEmptyReadinessAssessment = (): ReadinessAssessment => ({
  overallScore: 0,
  categories: {
    technical: { score: 0, feedbackId: "empty" },
    softSkills: { score: 0, feedbackId: "empty" },
    industryKnowledge: { score: 0, feedbackId: "empty" },
    portfolio: { score: 0, feedbackId: "empty" },
  },
  improvementSuggestions: ["imp_tech_map", "imp_evidence_add", "imp_portfolio_build"],
  nextSteps: ["step_map_skills_5", "step_explore_categories", "step_setup_profile"],
});

const calculateCategoryScore = (skills: SkillMapping[]): number => {
  if (skills.length === 0) return 0;
  const averageConfidence =
    skills.reduce((sum, skill) => sum + skill.confidence, 0) / skills.length;
  const countBonus = Math.min(COUNT_TWENTY, skills.length * 2);
  return Math.min(PERCENT_MAX, Math.round(averageConfidence + countBonus));
};

const calculateReadinessMetrics = (mappings: SkillMapping[]): ReadinessMetrics => {
  const technicalSkills = mappings.filter(
    (mapping) => mapping.category === "technical" || mapping.category === "analytical",
  );
  const softSkills = mappings.filter(
    (mapping) =>
      mapping.category === "leadership" ||
      mapping.category === "communication" ||
      mapping.category === "community",
  );
  const technicalScore = calculateCategoryScore(technicalSkills);
  const softSkillsScore = calculateCategoryScore(softSkills);
  const industryScore = Math.min(
    PERCENT_MAX,
    mappings.flatMap((mapping) => mapping.industryApplications).length * 10,
  );
  const portfolioScore = Math.min(
    PERCENT_MAX,
    mappings.reduce((sum, mapping) => sum + mapping.evidence.length, 0) * COUNT_TWENTY,
  );
  const overallScore = Math.round(
    technicalScore * RATIO_THREE_TENTHS +
      softSkillsScore * RATIO_ONE_QUARTER +
      industryScore * RATIO_ONE_FIFTH +
      portfolioScore * RATIO_ONE_QUARTER,
  );

  return {
    technicalSkills,
    softSkills,
    technicalScore,
    softSkillsScore,
    industryScore,
    portfolioScore,
    overallScore,
  };
};

const getCategoryFeedback = (score: number): SkillReadinessFeedbackId => {
  if (score >= SCORE_PASS_THRESHOLD) return "excellent";
  if (score >= SCORE_WARNING_THRESHOLD) return "good";
  if (score >= SCORE_DEVELOPING_THRESHOLD) return "developing";
  return "early";
};

const getTechnicalImprovements = (score: number): SkillReadinessImprovementId[] =>
  score >= COUNT_SEVENTY ? [] : ["imp_tech_map", "imp_conf_up"];

const getSoftSkillImprovements = (score: number): SkillReadinessImprovementId[] =>
  score >= COUNT_SEVENTY ? [] : ["imp_lead_comm", "imp_team_examples"];

const getIndustryImprovements = (score: number): SkillReadinessImprovementId[] =>
  score >= COUNT_SEVENTY ? [] : ["imp_industry_research", "imp_role_link"];

const getPortfolioImprovements = (score: number): SkillReadinessImprovementId[] =>
  score >= COUNT_SEVENTY ? [] : ["imp_evidence_add", "imp_portfolio_build", "imp_achievements_doc"];

const getImprovementSuggestions = (
  overall: number,
  technical: number,
  soft: number,
  portfolio: number,
): SkillReadinessImprovementId[] => {
  const suggestions: SkillReadinessImprovementId[] = [];

  if (technical < SCORE_WARNING_THRESHOLD) suggestions.push("imp_transfer_strengthen");
  if (soft < SCORE_WARNING_THRESHOLD) suggestions.push("imp_leadership_highlight");
  if (portfolio < SCORE_WARNING_THRESHOLD) suggestions.push("imp_evidence_add");
  if (overall < COUNT_FIFTY) suggestions.push("imp_coverage_broaden");

  if (suggestions.length === 0) {
    suggestions.push("imp_examples_refine", "imp_certs_pursue", "imp_network_pro");
  }

  return suggestions;
};

const getNextSteps = (overall: number): SkillReadinessNextStepId[] => {
  if (overall >= SCORE_PASS_THRESHOLD) {
    return [
      "step_apply_roles",
      "step_network_industry",
      "step_prepare_interviews",
      "step_polish_linkedin",
    ];
  }
  if (overall >= SCORE_WARNING_THRESHOLD) {
    return [
      "step_complete_portfolio",
      "step_map_skills_15",
      "step_evidence_top",
      "step_research_targets",
    ];
  }
  if (overall >= SCORE_DEVELOPING_THRESHOLD) {
    return [
      "step_map_skills_10",
      "step_start_portfolio",
      "step_evidence_abilities",
      "step_explore_pathways",
    ];
  }
  return [
    "step_map_skills_5",
    "step_explore_categories",
    "step_learn_careers",
    "step_setup_profile",
  ];
};

const buildReadinessAssessment = (metrics: ReadinessMetrics): ReadinessAssessment => ({
  overallScore: metrics.overallScore,
  categories: {
    technical: {
      score: metrics.technicalScore,
      feedbackId: getCategoryFeedback(metrics.technicalScore),
      strengths: metrics.technicalSkills
        .slice(0, COUNT_THREE)
        .map((mapping) => mapping.transferableSkill),
      improvements: getTechnicalImprovements(metrics.technicalScore),
    },
    softSkills: {
      score: metrics.softSkillsScore,
      feedbackId: getCategoryFeedback(metrics.softSkillsScore),
      strengths: metrics.softSkills
        .slice(0, COUNT_THREE)
        .map((mapping) => mapping.transferableSkill),
      improvements: getSoftSkillImprovements(metrics.softSkillsScore),
    },
    industryKnowledge: {
      score: metrics.industryScore,
      feedbackId: getCategoryFeedback(metrics.industryScore),
      improvements: getIndustryImprovements(metrics.industryScore),
    },
    portfolio: {
      score: metrics.portfolioScore,
      feedbackId: getCategoryFeedback(metrics.portfolioScore),
      improvements: getPortfolioImprovements(metrics.portfolioScore),
    },
  },
  improvementSuggestions: getImprovementSuggestions(
    metrics.overallScore,
    metrics.technicalScore,
    metrics.softSkillsScore,
    metrics.portfolioScore,
  ),
  nextSteps: getNextSteps(metrics.overallScore),
});

export const buildSkillReadinessAssessment = (mappings: SkillMapping[]): ReadinessAssessment =>
  mappings.length === 0
    ? buildEmptyReadinessAssessment()
    : buildReadinessAssessment(calculateReadinessMetrics(mappings));

const normalizeTargetSkill = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : "";
};

const collectJobTargetSkills = (job: ReadinessJobTarget): string[] => {
  const combined = [...job.requirements, ...job.technologies];
  const normalized = combined.map(normalizeTargetSkill).filter((entry) => entry.length > 0);
  return Array.from(new Set(normalized));
};

const mappingCoversTarget = (mapping: SkillMapping, target: string): boolean => {
  if (target.length === 0) {
    return false;
  }
  const candidates = [
    mapping.transferableSkill,
    mapping.gameExpression,
    ...mapping.industryApplications,
  ]
    .map((entry) => (typeof entry === "string" ? entry.trim().toLowerCase() : ""))
    .filter((entry) => entry.length > 0);
  return candidates.some((candidate) => target.includes(candidate) || candidate.includes(target));
};

const buildRecommendedActions = (matchingSkills: string[], missingSkills: string[]): string[] => {
  const actions: string[] = [];
  if (missingSkills.length > 0) {
    const preview = missingSkills.slice(0, COUNT_THREE).join(", ");
    actions.push(`Build skill mappings that cover: ${preview}`);
  }
  if (matchingSkills.length > 0) {
    actions.push("Add evidence (clips, stats, achievements) for matched skills");
  }
  if (missingSkills.length === 0 && matchingSkills.length === 0) {
    actions.push("Add requirements or technologies to this job posting, then re-run readiness");
  }
  return actions;
};

const estimateTimeToReady = (readinessScore: number): string => {
  if (readinessScore >= SCORE_PASS_THRESHOLD) return "Ready now";
  if (readinessScore >= SCORE_WARNING_THRESHOLD) return "1-2 weeks";
  if (readinessScore >= SCORE_DEVELOPING_THRESHOLD) return "1-3 months";
  return "3+ months";
};

/**
 * Compares the candidate's skill mappings against a scraped job's requirements and
 * technologies, producing a `RoleReadiness` entry the readiness route returns as
 * `targetRoleReadiness`. The `?jobId` query used to be echoed back without reading
 * the job, so the UI could never show job-targeted gaps even though the contract
 * already declared the field.
 */
export const buildRoleReadiness = (
  job: ReadinessJobTarget,
  mappings: SkillMapping[],
): RoleReadiness => {
  const targetSkills = collectJobTargetSkills(job);
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const target of targetSkills) {
    const hasMatch = mappings.some((mapping) => mappingCoversTarget(mapping, target));
    if (hasMatch) {
      matchingSkills.push(target);
    } else {
      missingSkills.push(target);
    }
  }
  const totalSkills = matchingSkills.length + missingSkills.length;
  const readinessScore =
    totalSkills > 0 ? Math.round((matchingSkills.length / totalSkills) * PERCENT_MAX) : 0;
  return {
    roleId: job.id,
    roleTitle: job.title,
    readinessScore,
    missingSkills: missingSkills.slice(0, COUNT_FIVE),
    matchingSkills: matchingSkills.slice(0, COUNT_FIVE),
    timeToReady: estimateTimeToReady(readinessScore),
    recommendedActions: buildRecommendedActions(matchingSkills, missingSkills),
  };
};

export const buildSkillReadinessAssessmentForJob = (
  mappings: SkillMapping[],
  job: ReadinessJobTarget,
): ReadinessAssessment => ({
  ...buildSkillReadinessAssessment(mappings),
  targetRoleReadiness: [buildRoleReadiness(job, mappings)],
});
