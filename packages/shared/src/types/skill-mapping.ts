/**
 * Skill mapping types for gaming-to-career translation
 */

/**
 * Canonical skill category identifiers shared by client and server.
 */
export const SKILL_CATEGORY_IDS = [
  "leadership",
  "community",
  "technical",
  "creative",
  "analytical",
  "communication",
  "project_management",
] as const;

/**
 * Skill category identifier.
 */
export type SkillCategory = (typeof SKILL_CATEGORY_IDS)[number];

/**
 * Canonical evidence type identifiers shared by client and server.
 */
export const SKILL_EVIDENCE_TYPE_IDS = [
  "clip",
  "stats",
  "community",
  "achievement",
  "document",
  "portfolio_piece",
  "testimonial",
  "certificate",
] as const;

/**
 * Supported evidence type identifier.
 */
export type EvidenceType = (typeof SKILL_EVIDENCE_TYPE_IDS)[number];

/**
 * Canonical demand-level identifiers for skill mappings.
 */
export const SKILL_DEMAND_LEVEL_IDS = ["high", "medium", "low"] as const;

/**
 * Demand-level identifier for career relevance.
 */
export type SkillDemandLevel = (typeof SKILL_DEMAND_LEVEL_IDS)[number];

/**
 * Canonical evidence verification status identifiers.
 */
export const SKILL_EVIDENCE_VERIFICATION_STATUS_IDS = ["pending", "verified", "rejected"] as const;

/**
 * Evidence verification state.
 */
export type SkillEvidenceVerificationStatus =
  (typeof SKILL_EVIDENCE_VERIFICATION_STATUS_IDS)[number];

/**
 * Canonical readiness feedback identifiers shared by API and UI translation catalogs.
 */
export const SKILL_READINESS_FEEDBACK_IDS = [
  "empty",
  "early",
  "developing",
  "good",
  "excellent",
] as const;

/**
 * Readiness feedback identifier used for localized category feedback copy.
 */
export type SkillReadinessFeedbackId = (typeof SKILL_READINESS_FEEDBACK_IDS)[number];

/**
 * Canonical readiness-improvement identifiers shared by API and UI translation catalogs.
 */
export const SKILL_READINESS_IMPROVEMENT_IDS = [
  "mapTechnicalSkills",
  "increaseSkillConfidence",
  "mapLeadershipCommunication",
  "addTeamCollaborationExamples",
  "researchIndustryApplications",
  "connectSkillsToJobRoles",
  "addSkillEvidence",
  "buildPortfolioProjects",
  "documentAchievements",
  "strengthenTechnicalTransfer",
  "highlightLeadershipExperience",
  "broadenSkillCoverage",
  "refineSpecificExamples",
  "pursueCertifications",
  "networkWithProfessionals",
] as const;

/**
 * Readiness-improvement identifier used for localized recommendation copy.
 */
export type SkillReadinessImprovementId = (typeof SKILL_READINESS_IMPROVEMENT_IDS)[number];

/**
 * Canonical readiness next-step identifiers shared by API and UI translation catalogs.
 */
export const SKILL_READINESS_NEXT_STEP_IDS = [
  "startApplyingToTargetRoles",
  "networkWithIndustryProfessionals",
  "prepareForTechnicalInterviews",
  "polishLinkedInProfile",
  "completePortfolioProjects",
  "mapMoreSkillsToReachFifteen",
  "addEvidenceToTopSkills",
  "researchTargetCompaniesAndRoles",
  "mapTenPlusSkills",
  "startBuildingPortfolioProjects",
  "addEvidenceToDemonstrateAbilities",
  "exploreMatchingCareerPathways",
  "mapFirstFiveSkills",
  "exploreSkillCategories",
  "learnGamingCareerOptions",
  "setUpProfessionalProfile",
] as const;

/**
 * Readiness next-step identifier used for localized next-step copy.
 */
export type SkillReadinessNextStepId = (typeof SKILL_READINESS_NEXT_STEP_IDS)[number];

export interface GameSkill {
  id: string;
  name: string;
  source: "gaming" | "professional" | "education" | "personal";
  category: SkillCategory;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  verified: boolean;
}

export interface SkillMapping {
  id: string;
  gameExpression: string;
  transferableSkill: string;
  industryApplications: string[];
  evidenceSuggestions?: string[];
  evidence: SkillEvidence[];
  confidence: number;
  category: SkillCategory;
  demandLevel: SkillDemandLevel;
  verified: boolean;
  aiGenerated?: boolean;
}

export interface SkillEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  url?: string;
  verificationStatus: SkillEvidenceVerificationStatus;
}

export interface CareerPathway {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  matchScore: number;
  stages: PathwayStage[];
  requiredSkills: string[];
  estimatedTimeToEntry: string;
  icon?: string;
  averageSalary?: { min: number; max: number; currency?: string };
  jobMarketTrend: "growing" | "stable" | "declining";
}

export interface PathwayStage {
  title: string;
  duration: string;
  description: string;
  completed?: boolean;
  current?: boolean;
  requirements?: string[];
  outcomes?: string[];
}

export interface ReadinessAssessment {
  overallScore: number;
  categories: {
    technical: CategoryAssessment;
    softSkills: CategoryAssessment;
    industryKnowledge: CategoryAssessment;
    portfolio: CategoryAssessment;
  };
  improvementSuggestions: SkillReadinessImprovementId[];
  nextSteps: SkillReadinessNextStepId[];
  targetRoleReadiness?: RoleReadiness[];
}

export interface CategoryAssessment {
  score: number;
  feedbackId: SkillReadinessFeedbackId;
  strengths?: string[];
  improvements?: SkillReadinessImprovementId[];
}

export interface RoleReadiness {
  roleId: string;
  roleTitle: string;
  readinessScore: number;
  missingSkills: string[];
  matchingSkills: string[];
  timeToReady?: string;
  recommendedActions: string[];
}

export interface SkillWebNode {
  id: string;
  type: "central" | "category" | "skill";
  label: string;
  x: number;
  y: number;
  radius: number;
  color?: string;
  strength?: "weak" | "moderate" | "strong";
  connections?: string[];
}

export interface SkillWebConnection {
  from: string;
  to: string;
  strength: "weak" | "moderate" | "strong";
  type: "primary" | "secondary";
}
