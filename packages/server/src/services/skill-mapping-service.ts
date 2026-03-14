import type {
  CareerPathway,
  ReadinessAssessment,
  SkillCategory,
  SkillEvidence,
  SkillMapping,
  SkillReadinessFeedbackId,
  SkillReadinessImprovementId,
  SkillReadinessNextStepId,
} from "@bao/shared";
import {
  API_ERROR_CREATE_SKILL_MAPPING,
  generateId,
  getGamificationPathwayIcon,
  isRecord,
  PATHWAY_SALARY_RANGES,
  SCORE_DEVELOPING_THRESHOLD,
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
  SKILL_CATEGORY_IDS,
  SKILL_EVIDENCE_TYPE_IDS,
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { skillMappings } from "../db/schema/schema-modules";

const isSkillCategory = (value: string | null): value is SkillCategory =>
  typeof value === "string" && SKILL_CATEGORY_IDS.some((categoryId) => categoryId === value);

const isEvidenceType = (value: unknown): value is SkillEvidence["type"] =>
  typeof value === "string" && SKILL_EVIDENCE_TYPE_IDS.some((typeId) => typeId === value);

const isEvidenceStatus = (value: unknown): value is SkillEvidence["verificationStatus"] =>
  typeof value === "string" &&
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS.some((statusId) => statusId === value);

const resolvePathwayIcon = (pathwayId: string): string => getGamificationPathwayIcon(pathwayId);

const normalizeSkillCategory = (value: string | null): SkillCategory =>
  isSkillCategory(value) ? value : "technical";

const normalizeEvidenceType = (value: unknown): SkillEvidence["type"] =>
  isEvidenceType(value) ? value : "document";

const normalizeEvidenceStatus = (value: unknown): SkillEvidence["verificationStatus"] =>
  isEvidenceStatus(value) ? value : "pending";

const normalizeEvidenceEntries = (value: unknown[] | null): SkillEvidence[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: SkillEvidence[] = [];
  for (const evidence of value) {
    if (!isRecord(evidence)) continue;
    if (typeof evidence.id !== "string") continue;
    if (typeof evidence.title !== "string") continue;
    if (typeof evidence.description !== "string") continue;

    entries.push({
      id: evidence.id,
      type: normalizeEvidenceType(evidence.type),
      title: evidence.title,
      description: evidence.description,
      url: typeof evidence.url === "string" ? evidence.url : undefined,
      verificationStatus: normalizeEvidenceStatus(evidence.verificationStatus),
    });
  }

  return entries;
};

type CareerPathwayDefinition = Omit<CareerPathway, "id" | "matchScore">;
type ReadinessMetrics = {
  technicalSkills: SkillMapping[];
  softSkills: SkillMapping[];
  technicalScore: number;
  softSkillsScore: number;
  industryScore: number;
  portfolioScore: number;
  overallScore: number;
};

const PATHWAY_DEFINITIONS: Record<SkillCategory, CareerPathwayDefinition> = {
  technical: {
    title: "Technical Specialist",
    description:
      "Leverage your technical gaming skills in software development, game development, or technical roles",
    detailedDescription:
      "Transform your gaming expertise into a thriving technical career. Your experience with game mechanics, mods, and technical problem-solving translates directly to software engineering, game development, and DevOps roles.",
    stages: [
      {
        title: "Foundation",
        duration: "1-3 months",
        description: "Build core programming fundamentals",
        completed: false,
        current: true,
      },
      {
        title: "Specialization",
        duration: "3-6 months",
        description: "Focus on game engines or backend systems",
        completed: false,
      },
      {
        title: "Portfolio",
        duration: "2-4 months",
        description: "Create showcase projects",
        completed: false,
      },
      {
        title: "Job Ready",
        duration: "1-2 months",
        description: "Interview prep and applications",
        completed: false,
      },
    ],
    requiredSkills: ["Programming", "Problem Solving", "Game Engines", "Version Control"],
    estimatedTimeToEntry: "6-12 months",
    icon: resolvePathwayIcon("technical"),
    averageSalary: {
      min: PATHWAY_SALARY_RANGES.technical.min,
      max: PATHWAY_SALARY_RANGES.technical.max,
      currency: "USD",
    },
    jobMarketTrend: "growing",
  },
  leadership: {
    title: "Team Lead / Manager",
    description: "Channel your guild leadership and team coordination into management roles",
    detailedDescription:
      "Your experience leading raids, managing teams, and coordinating complex group activities directly translates to project management and team leadership positions.",
    stages: [
      {
        title: "Team Collaboration",
        duration: "2-3 months",
        description: "Master collaboration tools and methodologies",
        completed: false,
        current: true,
      },
      {
        title: "Project Management",
        duration: "3-4 months",
        description: "Learn PM frameworks and tools",
        completed: false,
      },
      {
        title: "Leadership Skills",
        duration: "2-3 months",
        description: "Develop communication and mentoring",
        completed: false,
      },
      {
        title: "Certification",
        duration: "1-2 months",
        description: "Optional PM certification",
        completed: false,
      },
    ],
    requiredSkills: [
      "Team Coordination",
      "Communication",
      "Conflict Resolution",
      "Strategic Planning",
    ],
    estimatedTimeToEntry: "8-12 months",
    icon: resolvePathwayIcon("leadership"),
    averageSalary: {
      min: PATHWAY_SALARY_RANGES.leadership.min,
      max: PATHWAY_SALARY_RANGES.leadership.max,
      currency: "USD",
    },
    jobMarketTrend: "stable",
  },
  community: {
    title: "Community Manager",
    description:
      "Turn your community building experience into a career managing online communities",
    detailedDescription:
      "Your skills in building, moderating, and growing gaming communities are highly valuable in community management, social media, and customer success roles.",
    stages: [
      {
        title: "Community Fundamentals",
        duration: "1-2 months",
        description: "Learn community management best practices",
        completed: false,
        current: true,
      },
      {
        title: "Platform Mastery",
        duration: "2-3 months",
        description: "Master Discord, Reddit, social media",
        completed: false,
      },
      {
        title: "Content Strategy",
        duration: "2-3 months",
        description: "Develop content and engagement strategies",
        completed: false,
      },
      {
        title: "Portfolio Projects",
        duration: "2-3 months",
        description: "Build case studies and examples",
        completed: false,
      },
    ],
    requiredSkills: ["Community Building", "Moderation", "Social Media", "Content Creation"],
    estimatedTimeToEntry: "6-9 months",
    icon: resolvePathwayIcon("community"),
    averageSalary: {
      min: PATHWAY_SALARY_RANGES.community.min,
      max: PATHWAY_SALARY_RANGES.community.max,
      currency: "USD",
    },
    jobMarketTrend: "growing",
  },
  creative: {
    title: "Creative Professional",
    description: "Apply your creative gaming skills to design, content creation, or artistic roles",
    detailedDescription:
      "Your experience creating content, designing mods, or building in creative games translates directly to UX/UI design, game design, and creative development roles.",
    stages: [
      {
        title: "Design Fundamentals",
        duration: "2-4 months",
        description: "Learn design principles and tools",
        completed: false,
        current: true,
      },
      {
        title: "Specialization",
        duration: "3-6 months",
        description: "Choose UI/UX, game design, or content",
        completed: false,
      },
      {
        title: "Portfolio Development",
        duration: "3-6 months",
        description: "Build professional portfolio",
        completed: false,
      },
      {
        title: "Industry Entry",
        duration: "2-3 months",
        description: "Networking and applications",
        completed: false,
      },
    ],
    requiredSkills: ["Design Thinking", "Visual Design", "User Experience", "Creative Tools"],
    estimatedTimeToEntry: "10-18 months",
    icon: resolvePathwayIcon("creative"),
    averageSalary: {
      min: PATHWAY_SALARY_RANGES.creative.min,
      max: PATHWAY_SALARY_RANGES.creative.max,
      currency: "USD",
    },
    jobMarketTrend: "stable",
  },
  analytical: {
    title: "Data Analyst",
    description:
      "Use your analytical and optimization skills in data analysis and business intelligence",
    detailedDescription:
      "Your experience analyzing game mechanics, optimizing builds, and making data-driven decisions translates perfectly to data analysis, business intelligence, and analytics roles.",
    stages: [
      {
        title: "Data Fundamentals",
        duration: "2-3 months",
        description: "Learn SQL, Excel, statistics basics",
        completed: false,
        current: true,
      },
      {
        title: "Analysis Tools",
        duration: "3-4 months",
        description: "Master Tableau, Power BI, Python",
        completed: false,
      },
      {
        title: "Business Context",
        duration: "2-3 months",
        description: "Learn business analysis frameworks",
        completed: false,
      },
      {
        title: "Portfolio Projects",
        duration: "2-3 months",
        description: "Build analysis case studies",
        completed: false,
      },
    ],
    requiredSkills: ["Data Analysis", "Statistical Thinking", "SQL", "Visualization"],
    estimatedTimeToEntry: "8-12 months",
    icon: resolvePathwayIcon("analytical"),
    averageSalary: {
      min: PATHWAY_SALARY_RANGES.analytical.min,
      max: PATHWAY_SALARY_RANGES.analytical.max,
      currency: "USD",
    },
    jobMarketTrend: "growing",
  },
  communication: {
    title: "Communications Specialist",
    description: "Leverage your communication skills in marketing, PR, or content creation roles",
    detailedDescription:
      "Your experience communicating with teams, creating guides, and explaining complex concepts translates to technical writing, marketing, and communications roles.",
    stages: [
      {
        title: "Writing Fundamentals",
        duration: "1-2 months",
        description: "Develop professional writing skills",
        completed: false,
        current: true,
      },
      {
        title: "Content Creation",
        duration: "2-3 months",
        description: "Learn content marketing and strategy",
        completed: false,
      },
      {
        title: "Platform Skills",
        duration: "2-3 months",
        description: "Master various communication platforms",
        completed: false,
      },
      {
        title: "Portfolio Building",
        duration: "2-3 months",
        description: "Create writing samples and case studies",
        completed: false,
      },
    ],
    requiredSkills: ["Written Communication", "Content Strategy", "Storytelling", "Editing"],
    estimatedTimeToEntry: "6-10 months",
    icon: resolvePathwayIcon("communication"),
    averageSalary: {
      min: PATHWAY_SALARY_RANGES.communication.min,
      max: PATHWAY_SALARY_RANGES.communication.max,
      currency: "USD",
    },
    jobMarketTrend: "stable",
  },
  project_management: {
    title: "Project Manager",
    description: "Apply your planning and coordination skills to professional project management",
    detailedDescription:
      "Your experience planning raids, coordinating events, and managing complex projects in games translates directly to professional project management roles.",
    stages: [
      {
        title: "PM Fundamentals",
        duration: "2-3 months",
        description: "Learn Agile, Scrum, project basics",
        completed: false,
        current: true,
      },
      {
        title: "Tool Mastery",
        duration: "2-3 months",
        description: "Master Jira, Asana, MS Project",
        completed: false,
      },
      {
        title: "Certification Prep",
        duration: "3-4 months",
        description: "Study for PMP or CSM certification",
        completed: false,
      },
      {
        title: "Experience Building",
        duration: "3-6 months",
        description: "Lead volunteer or small projects",
        completed: false,
      },
    ],
    requiredSkills: [
      "Project Planning",
      "Risk Management",
      "Stakeholder Management",
      "Agile/Scrum",
    ],
    estimatedTimeToEntry: "10-16 months",
    icon: resolvePathwayIcon("project_management"),
    averageSalary: {
      min: PATHWAY_SALARY_RANGES.project_management.min,
      max: PATHWAY_SALARY_RANGES.project_management.max,
      currency: "USD",
    },
    jobMarketTrend: "growing",
  },
};

export class SkillMappingService {
  /**
   * Get all skill mappings
   */
  async getMappings(): Promise<SkillMapping[]> {
    const results = await db.select().from(skillMappings);

    return results.map((row) => ({
      id: row.id,
      gameExpression: row.gameExpression,
      transferableSkill: row.transferableSkill,
      industryApplications: row.industryApplications || [],
      evidence: normalizeEvidenceEntries(row.evidence),
      confidence: row.confidence || 50,
      category: normalizeSkillCategory(row.category),
      demandLevel: this.normalizeDemandLevel(row.demandLevel),
      verified: false,
      aiGenerated: row.aiGenerated ?? undefined,
    }));
  }

  /**
   * Create a new skill mapping
   */
  async createMapping(data: Omit<SkillMapping, "id">): Promise<SkillMapping> {
    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(skillMappings).values({
      id,
      gameExpression: data.gameExpression,
      transferableSkill: data.transferableSkill,
      industryApplications: data.industryApplications || [],
      evidence: data.evidence || [],
      confidence: data.confidence || 50,
      category: data.category,
      demandLevel: data.demandLevel,
      aiGenerated: data.aiGenerated,
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.getMapping(id);
    if (!created) {
      throw new Error(API_ERROR_CREATE_SKILL_MAPPING);
    }

    return created;
  }

  /**
   * Get a single skill mapping by ID
   */
  async getMapping(id: string): Promise<SkillMapping | null> {
    const results = await db.select().from(skillMappings).where(eq(skillMappings.id, id));

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      gameExpression: row.gameExpression,
      transferableSkill: row.transferableSkill,
      industryApplications: row.industryApplications || [],
      evidence: normalizeEvidenceEntries(row.evidence),
      confidence: row.confidence || 50,
      category: normalizeSkillCategory(row.category),
      demandLevel: this.normalizeDemandLevel(row.demandLevel),
      verified: false,
      aiGenerated: row.aiGenerated ?? undefined,
    };
  }

  /**
   * Update a skill mapping
   */
  async updateMapping(id: string, data: Partial<SkillMapping>): Promise<SkillMapping | null> {
    const existing = await this.getMapping(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData: Partial<typeof skillMappings.$inferInsert> = {
      updatedAt: now,
    };

    if (data.gameExpression !== undefined) updateData.gameExpression = data.gameExpression;
    if (data.transferableSkill !== undefined) updateData.transferableSkill = data.transferableSkill;
    if (data.industryApplications !== undefined)
      updateData.industryApplications = data.industryApplications;
    if (data.evidence !== undefined) updateData.evidence = data.evidence;
    if (data.confidence !== undefined) updateData.confidence = data.confidence;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.demandLevel !== undefined) updateData.demandLevel = data.demandLevel;
    if (data.aiGenerated !== undefined) updateData.aiGenerated = data.aiGenerated;

    await db.update(skillMappings).set(updateData).where(eq(skillMappings.id, id));

    return await this.getMapping(id);
  }

  /**
   * Delete a skill mapping by ID.
   *
   * @param id - The mapping identifier to remove
   * @returns true when a row was deleted, false when nothing matched
   */
  async deleteMapping(id: string): Promise<boolean> {
    const existing = await this.getMapping(id);
    if (!existing) {
      return false;
    }

    await db.delete(skillMappings).where(eq(skillMappings.id, id));

    return true;
  }

  /**
   * Get career pathways grouped by category
   */
  async getPathways(): Promise<CareerPathway[]> {
    const mappings = await this.getMappings();
    const groupedMappings = this.groupMappingsByCategory(mappings);
    const pathways = Object.entries(groupedMappings).map(([category, skills]) =>
      this.buildPathway(category as SkillCategory, skills),
    );
    return pathways.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate career readiness based on skill mappings
   */
  async getReadiness(): Promise<ReadinessAssessment> {
    const mappings = await this.getMappings();
    if (mappings.length === 0) {
      return this.buildEmptyReadinessAssessment();
    }

    const metrics = this.calculateReadinessMetrics(mappings);
    return this.buildReadinessAssessment(metrics);
  }

  private groupMappingsByCategory(mappings: SkillMapping[]): Record<SkillCategory, SkillMapping[]> {
    const grouped: Record<SkillCategory, SkillMapping[]> = {
      technical: [],
      leadership: [],
      community: [],
      creative: [],
      analytical: [],
      communication: [],
      project_management: [],
    };
    for (const mapping of mappings) {
      grouped[mapping.category].push(mapping);
    }
    return grouped;
  }

  private buildPathway(category: SkillCategory, mappings: SkillMapping[]): CareerPathway {
    const definition = PATHWAY_DEFINITIONS[category];
    return {
      id: category,
      ...definition,
      matchScore: this.calculatePathwayMatchScore(mappings),
    };
  }

  private calculatePathwayMatchScore(mappings: SkillMapping[]): number {
    if (mappings.length === 0) {
      return 0;
    }
    const averageConfidence =
      mappings.reduce((sum, mapping) => sum + mapping.confidence, 0) / mappings.length;
    return Math.min(100, Math.round(averageConfidence * (1 + mappings.length / 10)));
  }

  private buildEmptyReadinessAssessment(): ReadinessAssessment {
    return {
      overallScore: 0,
      categories: {
        technical: { score: 0, feedbackId: "empty" },
        softSkills: { score: 0, feedbackId: "empty" },
        industryKnowledge: { score: 0, feedbackId: "empty" },
        portfolio: { score: 0, feedbackId: "empty" },
      },
      improvementSuggestions: ["imp_tech_map", "imp_evidence_add", "imp_portfolio_build"],
      nextSteps: ["step_map_skills_5", "step_explore_categories", "step_setup_profile"],
    };
  }

  private calculateReadinessMetrics(mappings: SkillMapping[]): ReadinessMetrics {
    const technicalSkills = mappings.filter(
      (mapping) => mapping.category === "technical" || mapping.category === "analytical",
    );
    const softSkills = mappings.filter(
      (mapping) =>
        mapping.category === "leadership" ||
        mapping.category === "communication" ||
        mapping.category === "community",
    );
    const technicalScore = this.calculateCategoryScore(technicalSkills);
    const softSkillsScore = this.calculateCategoryScore(softSkills);
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
  }

  private buildReadinessAssessment(metrics: ReadinessMetrics): ReadinessAssessment {
    return {
      overallScore: metrics.overallScore,
      categories: {
        technical: {
          score: metrics.technicalScore,
          feedbackId: this.getCategoryFeedback(metrics.technicalScore),
          strengths: metrics.technicalSkills
            .slice(0, 3)
            .map((mapping) => mapping.transferableSkill),
          improvements: this.getTechnicalImprovements(metrics.technicalScore),
        },
        softSkills: {
          score: metrics.softSkillsScore,
          feedbackId: this.getCategoryFeedback(metrics.softSkillsScore),
          strengths: metrics.softSkills.slice(0, 3).map((mapping) => mapping.transferableSkill),
          improvements: this.getSoftSkillImprovements(metrics.softSkillsScore),
        },
        industryKnowledge: {
          score: metrics.industryScore,
          feedbackId: this.getCategoryFeedback(metrics.industryScore),
          improvements: this.getIndustryImprovements(metrics.industryScore),
        },
        portfolio: {
          score: metrics.portfolioScore,
          feedbackId: this.getCategoryFeedback(metrics.portfolioScore),
          improvements: this.getPortfolioImprovements(metrics.portfolioScore),
        },
      },
      improvementSuggestions: this.getImprovementSuggestions(
        metrics.overallScore,
        metrics.technicalScore,
        metrics.softSkillsScore,
        metrics.portfolioScore,
      ),
      nextSteps: this.getNextSteps(metrics.overallScore),
    };
  }

  private getTechnicalImprovements(score: number): SkillReadinessImprovementId[] {
    if (score >= 70) {
      return [];
    }
    return ["imp_tech_map", "imp_conf_up"];
  }

  private getSoftSkillImprovements(score: number): SkillReadinessImprovementId[] {
    if (score >= 70) {
      return [];
    }
    return ["imp_lead_comm", "imp_team_examples"];
  }

  private getIndustryImprovements(score: number): SkillReadinessImprovementId[] {
    if (score >= 70) {
      return [];
    }
    return ["imp_industry_research", "imp_role_link"];
  }

  private getPortfolioImprovements(score: number): SkillReadinessImprovementId[] {
    if (score >= 70) {
      return [];
    }
    return ["imp_evidence_add", "imp_portfolio_build", "imp_achievements_doc"];
  }

  /**
   * Calculate average confidence score for a category
   */
  private calculateCategoryScore(skills: SkillMapping[]): number {
    if (skills.length === 0) return 0;

    const avgConfidence = skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length;
    const countBonus = Math.min(20, skills.length * 2);

    return Math.min(100, Math.round(avgConfidence + countBonus));
  }

  /**
   * Get feedback bucket key for a category score.
   */
  private getCategoryFeedback(score: number): SkillReadinessFeedbackId {
    if (score >= SCORE_PASS_THRESHOLD) return "excellent";
    if (score >= SCORE_WARNING_THRESHOLD) return "good";
    if (score >= SCORE_DEVELOPING_THRESHOLD) return "developing";
    return "early";
  }

  /**
   * Get improvement suggestions based on scores
   */
  private getImprovementSuggestions(
    overall: number,
    technical: number,
    soft: number,
    portfolio: number,
  ): SkillReadinessImprovementId[] {
    const suggestions: SkillReadinessImprovementId[] = [];

    if (technical < SCORE_WARNING_THRESHOLD) {
      suggestions.push("imp_transfer_strengthen");
    }

    if (soft < SCORE_WARNING_THRESHOLD) {
      suggestions.push("imp_leadership_highlight");
    }

    if (portfolio < SCORE_WARNING_THRESHOLD) {
      suggestions.push("imp_evidence_add");
    }

    if (overall < 50) {
      suggestions.push("imp_coverage_broaden");
    }

    if (suggestions.length === 0) {
      suggestions.push("imp_examples_refine");
      suggestions.push("imp_certs_pursue");
      suggestions.push("imp_network_pro");
    }

    return suggestions;
  }

  /**
   * Get next steps based on overall readiness
   */
  private getNextSteps(overall: number): SkillReadinessNextStepId[] {
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
  }

  private normalizeDemandLevel(level: string | null): "high" | "medium" | "low" {
    if (level === "high" || level === "low") return level;
    return "medium";
  }
}

export const skillMappingService = new SkillMappingService();
