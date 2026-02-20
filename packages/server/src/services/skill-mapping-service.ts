import { generateId } from "@bao/shared";
import type {
  CareerPathway,
  CategoryAssessment,
  ReadinessAssessment,
  SkillEvidence,
  SkillCategory,
  SkillMapping,
} from "@bao/shared";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { skillMappings } from "../db/schema";

const SKILL_CATEGORIES: readonly SkillCategory[] = [
  "leadership",
  "community",
  "technical",
  "creative",
  "analytical",
  "communication",
  "project_management",
];

const DEMAND_LEVELS: readonly SkillMapping["demandLevel"][] = ["high", "medium", "low"];

const EVIDENCE_TYPES: readonly SkillEvidence["type"][] = [
  "clip",
  "stats",
  "community",
  "achievement",
  "document",
  "portfolio_piece",
  "testimonial",
  "certificate",
];

const EVIDENCE_STATUSES: readonly SkillEvidence["verificationStatus"][] = [
  "pending",
  "verified",
  "rejected",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeSkillCategory = (value: string | null): SkillCategory =>
  typeof value === "string" && SKILL_CATEGORIES.includes(value as SkillCategory)
    ? (value as SkillCategory)
    : "technical";

const normalizeEvidenceType = (value: unknown): SkillEvidence["type"] =>
  typeof value === "string" && EVIDENCE_TYPES.includes(value as SkillEvidence["type"])
    ? (value as SkillEvidence["type"])
    : "document";

const normalizeEvidenceStatus = (value: unknown): SkillEvidence["verificationStatus"] =>
  typeof value === "string" && EVIDENCE_STATUSES.includes(value as SkillEvidence["verificationStatus"])
    ? (value as SkillEvidence["verificationStatus"])
    : "pending";

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
      aiGenerated: row.aiGenerated || false,
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
      aiGenerated: data.aiGenerated || false,
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.getMapping(id);
    if (!created) {
      throw new Error("Failed to create skill mapping");
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
      aiGenerated: row.aiGenerated || false,
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

    // Group by category
    const categoryGroups: Record<string, SkillMapping[]> = {};

    for (const mapping of mappings) {
      const category = mapping.category;
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(mapping);
    }

    // Define career pathways for each category
    const pathwayDefinitions: Record<SkillCategory, Omit<CareerPathway, "id" | "matchScore">> = {
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
        icon: "mdi-code-braces",
        averageSalary: { min: 70000, max: 120000, currency: "USD" },
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
        icon: "mdi-account-group",
        averageSalary: { min: 80000, max: 140000, currency: "USD" },
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
        icon: "mdi-account-multiple",
        averageSalary: { min: 50000, max: 90000, currency: "USD" },
        jobMarketTrend: "growing",
      },
      creative: {
        title: "Creative Professional",
        description:
          "Apply your creative gaming skills to design, content creation, or artistic roles",
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
        icon: "mdi-palette",
        averageSalary: { min: 60000, max: 110000, currency: "USD" },
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
        icon: "mdi-chart-line",
        averageSalary: { min: 65000, max: 105000, currency: "USD" },
        jobMarketTrend: "growing",
      },
      communication: {
        title: "Communications Specialist",
        description:
          "Leverage your communication skills in marketing, PR, or content creation roles",
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
        icon: "mdi-comment-text",
        averageSalary: { min: 50000, max: 85000, currency: "USD" },
        jobMarketTrend: "stable",
      },
      project_management: {
        title: "Project Manager",
        description:
          "Apply your planning and coordination skills to professional project management",
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
        icon: "mdi-clipboard-check",
        averageSalary: { min: 75000, max: 130000, currency: "USD" },
        jobMarketTrend: "growing",
      },
    };

    // Create pathways with match scores
    const pathways: CareerPathway[] = Object.entries(categoryGroups).map(([category, skills]) => {
      const categoryKey = category as SkillCategory;
      const definition = pathwayDefinitions[categoryKey];

      // Calculate match score based on number of skills and their confidence
      const matchScore =
        skills.length > 0
          ? Math.min(
              100,
              Math.round(
                (skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length) *
                  (1 + skills.length / 10),
              ),
            )
          : 0;

      return {
        id: categoryKey,
        ...definition,
        matchScore,
      };
    });

    // Sort by match score
    return pathways.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate career readiness based on skill mappings
   */
  async getReadiness(): Promise<ReadinessAssessment> {
    const mappings = await this.getMappings();

    if (mappings.length === 0) {
      return {
        overallScore: 0,
        categories: {
          technical: { score: 0, feedback: "No technical skills mapped yet" },
          softSkills: { score: 0, feedback: "No soft skills mapped yet" },
          industryKnowledge: { score: 0, feedback: "No industry knowledge demonstrated" },
          portfolio: { score: 0, feedback: "No portfolio evidence provided" },
        },
        improvementSuggestions: [
          "Start mapping your gaming skills to career skills",
          "Add evidence to demonstrate your abilities",
          "Build a portfolio showcasing your work",
        ],
        nextSteps: [
          "Map at least 5 gaming skills",
          "Add evidence for your top skills",
          "Create your first portfolio project",
        ],
      };
    }

    // Calculate category scores
    const technicalSkills = mappings.filter(
      (m) => m.category === "technical" || m.category === "analytical",
    );
    const softSkills = mappings.filter(
      (m) =>
        m.category === "leadership" || m.category === "communication" || m.category === "community",
    );

    const technicalScore = this.calculateCategoryScore(technicalSkills);
    const softSkillsScore = this.calculateCategoryScore(softSkills);

    // Industry knowledge based on industry applications
    const industryApps = mappings.flatMap((m) => m.industryApplications);
    const industryScore = Math.min(100, industryApps.length * 10);

    // Portfolio based on evidence
    const evidenceCount = mappings.reduce((sum, m) => sum + m.evidence.length, 0);
    const portfolioScore = Math.min(100, evidenceCount * 20);

    // Overall score is weighted average
    const overallScore = Math.round(
      technicalScore * 0.3 + softSkillsScore * 0.25 + industryScore * 0.2 + portfolioScore * 0.25,
    );

    return {
      overallScore,
      categories: {
        technical: {
          score: technicalScore,
          feedback: this.getCategoryFeedback(technicalScore, "technical skills"),
          strengths: technicalSkills.slice(0, 3).map((s) => s.transferableSkill),
          improvements:
            technicalScore < 70
              ? ["Add more technical skill mappings", "Increase confidence in existing skills"]
              : [],
        },
        softSkills: {
          score: softSkillsScore,
          feedback: this.getCategoryFeedback(softSkillsScore, "soft skills"),
          strengths: softSkills.slice(0, 3).map((s) => s.transferableSkill),
          improvements:
            softSkillsScore < 70
              ? [
                  "Map more leadership and communication experiences",
                  "Add team collaboration examples",
                ]
              : [],
        },
        industryKnowledge: {
          score: industryScore,
          feedback: this.getCategoryFeedback(industryScore, "industry knowledge"),
          improvements:
            industryScore < 70
              ? ["Research more industry applications", "Connect skills to specific job roles"]
              : [],
        },
        portfolio: {
          score: portfolioScore,
          feedback: this.getCategoryFeedback(portfolioScore, "portfolio evidence"),
          improvements:
            portfolioScore < 70
              ? [
                  "Add more evidence to your skill mappings",
                  "Create portfolio projects",
                  "Document your achievements",
                ]
              : [],
        },
      },
      improvementSuggestions: this.getImprovementSuggestions(
        overallScore,
        technicalScore,
        softSkillsScore,
        portfolioScore,
      ),
      nextSteps: this.getNextSteps(overallScore),
    };
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
   * Get feedback text for a category score
   */
  private getCategoryFeedback(score: number, category: string): string {
    if (score >= 80) return `Excellent ${category}! You're well-prepared in this area.`;
    if (score >= 60) return `Good ${category}. Keep building to strengthen this area.`;
    if (score >= 40) return `Developing ${category}. Focus on adding more mappings and evidence.`;
    return `Early stage ${category}. This is an area for significant growth.`;
  }

  /**
   * Get improvement suggestions based on scores
   */
  private getImprovementSuggestions(
    overall: number,
    technical: number,
    soft: number,
    portfolio: number,
  ): string[] {
    const suggestions: string[] = [];

    if (technical < 60) {
      suggestions.push(
        "Strengthen your technical skills by mapping game mechanics knowledge to programming concepts",
      );
    }

    if (soft < 60) {
      suggestions.push("Highlight your leadership and communication experiences from gaming");
    }

    if (portfolio < 60) {
      suggestions.push(
        "Build evidence for your skills with clips, screenshots, or project documentation",
      );
    }

    if (overall < 50) {
      suggestions.push("Aim to map at least 10-15 diverse skills to show breadth of experience");
    }

    if (suggestions.length === 0) {
      suggestions.push("Continue refining your skill mappings with more specific examples");
      suggestions.push("Consider certifications to validate your technical skills");
      suggestions.push("Network with professionals in your target industry");
    }

    return suggestions;
  }

  /**
   * Get next steps based on overall readiness
   */
  private getNextSteps(overall: number): string[] {
    if (overall >= 80) {
      return [
        "Start applying to target roles",
        "Network with industry professionals",
        "Prepare for technical interviews",
        "Polish your LinkedIn profile",
      ];
    }

    if (overall >= 60) {
      return [
        "Complete your portfolio with 3-5 strong projects",
        "Map 5 more skills to reach 15+ total",
        "Add evidence to your top 10 skills",
        "Research target companies and roles",
      ];
    }

    if (overall >= 40) {
      return [
        "Map 10+ gaming skills to career skills",
        "Start building portfolio projects",
        "Add evidence to demonstrate your abilities",
        "Explore career pathways that match your skills",
      ];
    }

    return [
      "Map your first 5 gaming skills",
      "Explore different skill categories",
      "Learn about career options in gaming industry",
      "Set up your professional profile",
    ];
  }

  private normalizeDemandLevel(level: string | null): "high" | "medium" | "low" {
    if (level === "high" || level === "low") return level;
    return "medium";
  }
}

export const skillMappingService = new SkillMappingService();
