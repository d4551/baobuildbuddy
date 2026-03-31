import type {
  ReadinessAssessment,
  SkillMapping,
  SkillReadinessFeedbackId,
  SkillReadinessImprovementId,
  SkillReadinessNextStepId,
} from "@bao/shared";
import {
  SCORE_DEVELOPING_THRESHOLD,
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
} from "@bao/shared";

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
  const countBonus = Math.min(20, skills.length * 2);
  return Math.min(100, Math.round(averageConfidence + countBonus));
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
    100,
    mappings.flatMap((mapping) => mapping.industryApplications).length * 10,
  );
  const portfolioScore = Math.min(
    100,
    mappings.reduce((sum, mapping) => sum + mapping.evidence.length, 0) * 20,
  );
  const overallScore = Math.round(
    technicalScore * 0.3 + softSkillsScore * 0.25 + industryScore * 0.2 + portfolioScore * 0.25,
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
  score >= 70 ? [] : ["imp_tech_map", "imp_conf_up"];

const getSoftSkillImprovements = (score: number): SkillReadinessImprovementId[] =>
  score >= 70 ? [] : ["imp_lead_comm", "imp_team_examples"];

const getIndustryImprovements = (score: number): SkillReadinessImprovementId[] =>
  score >= 70 ? [] : ["imp_industry_research", "imp_role_link"];

const getPortfolioImprovements = (score: number): SkillReadinessImprovementId[] =>
  score >= 70 ? [] : ["imp_evidence_add", "imp_portfolio_build", "imp_achievements_doc"];

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
  if (overall < 50) suggestions.push("imp_coverage_broaden");

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
      strengths: metrics.technicalSkills.slice(0, 3).map((mapping) => mapping.transferableSkill),
      improvements: getTechnicalImprovements(metrics.technicalScore),
    },
    softSkills: {
      score: metrics.softSkillsScore,
      feedbackId: getCategoryFeedback(metrics.softSkillsScore),
      strengths: metrics.softSkills.slice(0, 3).map((mapping) => mapping.transferableSkill),
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
