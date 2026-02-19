/**
 * Skill mapping types for gaming-to-career translation
 */

export type SkillCategory =
  | "leadership"
  | "community"
  | "technical"
  | "creative"
  | "analytical"
  | "communication"
  | "project_management";

export type EvidenceType =
  | "clip"
  | "stats"
  | "community"
  | "achievement"
  | "document"
  | "portfolio_piece"
  | "testimonial"
  | "certificate";

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
  demandLevel: "high" | "medium" | "low";
  verified: boolean;
  aiGenerated?: boolean;
}

export interface SkillEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  url?: string;
  verificationStatus: "pending" | "verified" | "rejected";
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
  improvementSuggestions: string[];
  nextSteps: string[];
  targetRoleReadiness?: RoleReadiness[];
}

export interface CategoryAssessment {
  score: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
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
