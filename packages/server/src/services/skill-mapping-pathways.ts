import type { CareerPathway, SkillCategory, SkillMapping } from "@bao/shared";
import { getGamificationPathwayIcon, PATHWAY_SALARY_RANGES } from "@bao/shared";

type CareerPathwayDefinition = Omit<CareerPathway, "id" | "matchScore">;

const resolvePathwayIcon = (pathwayId: string): string => getGamificationPathwayIcon(pathwayId);

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

const emptyGroupedMappings = (): Record<SkillCategory, SkillMapping[]> => ({
  technical: [],
  leadership: [],
  community: [],
  creative: [],
  analytical: [],
  communication: [],
  project_management: [],
});

const groupMappingsByCategory = (
  mappings: SkillMapping[],
): Record<SkillCategory, SkillMapping[]> => {
  const grouped = emptyGroupedMappings();
  for (const mapping of mappings) {
    grouped[mapping.category].push(mapping);
  }
  return grouped;
};

const calculatePathwayMatchScore = (mappings: SkillMapping[]): number => {
  if (mappings.length === 0) {
    return 0;
  }
  const averageConfidence =
    mappings.reduce((sum, mapping) => sum + mapping.confidence, 0) / mappings.length;
  return Math.min(100, Math.round(averageConfidence * (1 + mappings.length / 10)));
};

const buildPathway = (category: SkillCategory, mappings: SkillMapping[]): CareerPathway => {
  const definition = PATHWAY_DEFINITIONS[category];
  return {
    id: category,
    ...definition,
    matchScore: calculatePathwayMatchScore(mappings),
  };
};

export const buildCareerPathways = (mappings: SkillMapping[]): CareerPathway[] =>
  Object.entries(groupMappingsByCategory(mappings))
    .map(([category, skills]) => buildPathway(category as SkillCategory, skills))
    .sort((left, right) => right.matchScore - left.matchScore);
