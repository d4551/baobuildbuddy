import { getJobTaxonomy } from "./jobs/job-taxonomy-service";

interface ExtractedSkill {
  name: string;
  category:
    | "engines"
    | "programming"
    | "design"
    | "art"
    | "tools"
    | "gamingTech"
    | "esports"
    | "transferable";
  confidence: number;
  proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
  source: string;
}

interface SkillGapAnalysis {
  matchPercentage: number;
  matched: string[];
  missing: string[];
  extra: string[];
  recommendations: string[];
}

const SKILL_PATTERNS: Record<string, Array<{ pattern: RegExp; name: string }>> = {
  design: [
    { pattern: /\blevel\s*design/i, name: "Level Design" },
    { pattern: /\bgame\s*design/i, name: "Game Design" },
    { pattern: /\bsystems?\s*design/i, name: "Systems Design" },
    { pattern: /\bnarrative\s*design/i, name: "Narrative Design" },
    { pattern: /\bquest\s*design/i, name: "Quest Design" },
    { pattern: /\bUX\s*design/i, name: "UX Design" },
    { pattern: /\bUI\s*design/i, name: "UI Design" },
    { pattern: /\bworld\s*build/i, name: "World Building" },
    { pattern: /\bcombat\s*design/i, name: "Combat Design" },
    { pattern: /\beconomy\s*design/i, name: "Economy Design" },
  ],
  art: [
    { pattern: /\b3D\s*model/i, name: "3D Modeling" },
    { pattern: /\bconcept\s*art/i, name: "Concept Art" },
    { pattern: /\btextur/i, name: "Texturing" },
    { pattern: /\brigging\b/i, name: "Rigging" },
    { pattern: /\banimat(?:ion|e|or)/i, name: "Animation" },
    { pattern: /\bVFX\b/i, name: "VFX" },
    { pattern: /\benvironment\s*art/i, name: "Environment Art" },
    { pattern: /\bcharacter\s*art/i, name: "Character Art" },
    { pattern: /\bpixel\s*art/i, name: "Pixel Art" },
    { pattern: /\btech(?:nical)?\s*art/i, name: "Technical Art" },
  ],
  esports: [
    { pattern: /\btournament/i, name: "Tournament Organization" },
    { pattern: /\bcompetitive\s*gaming/i, name: "Competitive Gaming" },
    { pattern: /\bstream(?:ing|er)/i, name: "Streaming" },
    { pattern: /\bcoach(?:ing)?\b/i, name: "Coaching" },
    { pattern: /\bbroadcast/i, name: "Broadcasting" },
    { pattern: /\bcontent\s*creat/i, name: "Content Creation" },
    { pattern: /\besports?\b/i, name: "Esports" },
    { pattern: /\bcommunity\s*manag/i, name: "Community Management" },
  ],
  transferable: [
    { pattern: /\bleadership\b/i, name: "Leadership" },
    { pattern: /\bproject\s*management/i, name: "Project Management" },
    { pattern: /\bagile\b/i, name: "Agile" },
    { pattern: /\bscrum\b/i, name: "Scrum" },
    { pattern: /\bcommunication/i, name: "Communication" },
    { pattern: /\bproblem.solving/i, name: "Problem Solving" },
    { pattern: /\banalytics?\b/i, name: "Analytics" },
    { pattern: /\bteamwork\b/i, name: "Teamwork" },
    { pattern: /\bmentoring\b/i, name: "Mentoring" },
    { pattern: /\bcross.functional/i, name: "Cross-functional Collaboration" },
  ],
};

const GAMING_TO_PROFESSIONAL: Record<string, string> = {
  "Guild Leader": "Team Leadership & Project Management",
  "Raid Coordinator": "Event Planning & Resource Management",
  Streamer: "Content Creation & Digital Marketing",
  Modder: "Software Development & Problem Solving",
  "Beta Tester": "Quality Assurance & Bug Reporting",
  "Game Master": "Community Management & Conflict Resolution",
  "Clan Manager": "Community Building & Team Leadership",
  "Tournament Player": "Performance Under Pressure & Strategic Thinking",
  "Content Creator": "Digital Marketing & Brand Building",
  "Game Reviewer": "Technical Writing & Critical Analysis",
  Speedrunner: "Analytical Thinking & Optimization",
  "Map Maker": "Level Design & Spatial Reasoning",
  "Server Admin": "System Administration & Community Management",
  "Esports Coach": "Leadership & Performance Analysis",
  "Wiki Editor": "Technical Documentation & Research",
};

const REQUIRED_SKILL_SENTENCE_PATTERN = /\b(required|must\s+have|essential|minimum|mandatory)\b/i;
const PREFERRED_SKILL_SENTENCE_PATTERN =
  /\b(preferred|nice\s+to\s+have|bonus|plus|desired|optional)\b/i;
const SENTENCE_SPLIT_PATTERN = /[.!?\n]+/;
const EXPERT_PROFICIENCY_PATTERN =
  /\b(expert|mastery|extensive|10\+?\s*years?|senior|lead|principal|architect)\b/i;
const ADVANCED_PROFICIENCY_PATTERN = /\b(advanced|strong|deep|5\+?\s*years?|senior|proficient)\b/i;
const INTERMEDIATE_PROFICIENCY_PATTERN =
  /\b(intermediate|experience\s+with|worked\s+with|3\+?\s*years?|familiar)\b/i;
const BEGINNER_PROFICIENCY_PATTERN = /\b(beginner|learning|basic|introduct|exposure|coursework)\b/i;
const REGEX_SPECIAL_CHARACTER_PATTERN = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (value: string): string => value.replace(REGEX_SPECIAL_CHARACTER_PATTERN, "\\$&");

const buildDynamicSkillPatterns = async (): Promise<Array<{ pattern: RegExp; name: string }>> => {
  const taxonomy = await getJobTaxonomy();
  return taxonomy.keywords
    .filter(
      (entry) =>
        entry.enabled && (entry.category === "technology" || entry.category === "requirement"),
    )
    .map((entry) => ({
      pattern: new RegExp(`\\b${escapeRegExp(entry.label)}\\b`, "i"),
      name: entry.label,
    }));
};

export class SkillExtractor {
  async extractSkills(text: string): Promise<ExtractedSkill[]> {
    const skills: ExtractedSkill[] = [];
    const seen = new Set<string>();
    const dynamicPatterns = await buildDynamicSkillPatterns();
    const patternGroups: Record<string, Array<{ pattern: RegExp; name: string }>> = {
      ...SKILL_PATTERNS,
      gamingTech: dynamicPatterns,
    };

    for (const [category, patterns] of Object.entries(patternGroups)) {
      for (const { pattern, name } of patterns) {
        if (seen.has(name)) continue;
        const match = text.match(pattern);
        if (match) {
          seen.add(name);
          const proficiency = this.detectProficiency(text, name);
          const contextStart = Math.max(0, (match.index || 0) - 30);
          const contextEnd = Math.min(text.length, (match.index || 0) + match[0].length + 30);
          skills.push({
            name,
            category: category as ExtractedSkill["category"],
            confidence: category === "transferable" ? 0.7 : 0.9,
            proficiency,
            source: text.slice(contextStart, contextEnd).trim(),
          });
        }
      }
    }

    return skills;
  }

  async extractFromJobDescription(description: string): Promise<{
    required: ExtractedSkill[];
    preferred: ExtractedSkill[];
  }> {
    const allSkills = await this.extractSkills(description);

    const sentences = description.split(SENTENCE_SPLIT_PATTERN);
    const requiredSentences = new Set<number>();
    const preferredSentences = new Set<number>();

    sentences.forEach((s, i) => {
      if (REQUIRED_SKILL_SENTENCE_PATTERN.test(s)) requiredSentences.add(i);
      if (PREFERRED_SKILL_SENTENCE_PATTERN.test(s)) preferredSentences.add(i);
    });

    const required: ExtractedSkill[] = [];
    const preferred: ExtractedSkill[] = [];

    for (const skill of allSkills) {
      const skillSentenceIdx = sentences.findIndex((s) => s.includes(skill.source.slice(0, 20)));
      if (preferredSentences.has(skillSentenceIdx)) {
        preferred.push(skill);
      } else {
        required.push(skill);
      }
    }

    return { required, preferred };
  }

  compareSkills(userSkills: ExtractedSkill[], jobSkills: ExtractedSkill[]): SkillGapAnalysis {
    const userSkillNames = new Set(userSkills.map((s) => s.name.toLowerCase()));
    const jobSkillNames = new Set(jobSkills.map((s) => s.name.toLowerCase()));

    const matched = [...jobSkillNames].filter((s) => userSkillNames.has(s));
    const missing = [...jobSkillNames].filter((s) => !userSkillNames.has(s));
    const extra = [...userSkillNames].filter((s) => !jobSkillNames.has(s));

    const matchPercentage =
      jobSkillNames.size > 0 ? Math.round((matched.length / jobSkillNames.size) * 100) : 0;

    const recommendations = missing.map((skill) => {
      const jobSkill = jobSkills.find((s) => s.name.toLowerCase() === skill);
      return `Learn ${jobSkill?.name || skill}: Focus on ${jobSkill?.category || "general"} skills to improve your match.`;
    });

    return { matchPercentage, matched, missing, extra, recommendations };
  }

  async mapGamingToCareer(
    gamingExperiences: string[],
  ): Promise<Array<{ gaming: string; professional: string }>> {
    const mappings: Array<{ gaming: string; professional: string }> = [];

    for (const exp of gamingExperiences) {
      for (const [gaming, professional] of Object.entries(GAMING_TO_PROFESSIONAL)) {
        if (exp.toLowerCase().includes(gaming.toLowerCase())) {
          mappings.push({ gaming: exp, professional });
        }
      }
      // Fallback: if no direct match, extract general transferable skills
      if (!mappings.find((m) => m.gaming === exp)) {
        const extracted = await this.extractSkills(exp);
        const transferable = extracted.filter((s) => s.category === "transferable");
        if (transferable.length > 0) {
          mappings.push({ gaming: exp, professional: transferable.map((s) => s.name).join(", ") });
        }
      }
    }

    return mappings;
  }

  private detectProficiency(text: string, skillName: string): ExtractedSkill["proficiency"] {
    const surroundingText = this.getSurroundingText(text, skillName, 100).toLowerCase();

    if (EXPERT_PROFICIENCY_PATTERN.test(surroundingText)) {
      return "expert";
    }
    if (ADVANCED_PROFICIENCY_PATTERN.test(surroundingText)) {
      return "advanced";
    }
    if (INTERMEDIATE_PROFICIENCY_PATTERN.test(surroundingText)) {
      return "intermediate";
    }
    if (BEGINNER_PROFICIENCY_PATTERN.test(surroundingText)) {
      return "beginner";
    }
    return "intermediate"; // default
  }

  private getSurroundingText(text: string, keyword: string, radius: number): string {
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) return "";
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + keyword.length + radius);
    return text.slice(start, end);
  }
}

export const skillExtractor = new SkillExtractor();
