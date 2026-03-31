import { asNumber, asString, asStringArray, isRecord, safeParseJson } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import {
  coverLetterPrompt,
  resumeEnhancePrompt,
  resumeScorePrompt,
} from "../services/ai/prompts-resume";
import type { CoverLetterSections, ResumeAnalysisResult } from "./ai-route-contracts";

interface ExperienceEntry {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
  achievements?: string[];
}

interface EducationEntry {
  degree?: string;
  institution?: string;
  year?: string;
}

interface ProjectEntry {
  name?: string;
  title?: string;
  description?: string;
  technologies?: string[];
}

export interface ResumeRecord {
  personalInfo?: Record<string, unknown> | null;
  summary?: string | null;
  experience?: unknown[] | null;
  education?: unknown[] | null;
  skills?: Record<string, unknown> | null;
  projects?: unknown[] | null;
  gamingExperience?: Record<string, unknown> | null;
}

const DEFAULT_ANALYZE_RESUME_RESPONSE: ResumeAnalysisResult = {
  score: 70,
  strengths: ["Well-formatted resume"],
  improvements: ["Add more specific achievements", "Include relevant keywords"],
  keywords: [],
};

const DEFAULT_COVER_LETTER_RESPONSE: CoverLetterSections = {
  introduction: "I am excited to apply for this position.",
  body: "My experience and skills make me a strong candidate for this role.",
  conclusion: "I look forward to discussing this opportunity with you.",
};

const JOB_DESCRIPTION_UNAVAILABLE = "No specific job description provided.";

const parseJsonRecord = (jsonString: string): Record<string, unknown> | null => {
  const cleaned = jsonString
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = safeParseJson(cleaned);
  return isRecord(parsed) ? parsed : null;
};

const parseExperienceEntries = (value: unknown[] | null | undefined): ExperienceEntry[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((entry) => ({
        title: asString(entry.title),
        company: asString(entry.company),
        duration: asString(entry.duration),
        description: asString(entry.description),
        achievements: asStringArray(entry.achievements),
      }))
    : [];

const parseEducationEntries = (value: unknown[] | null | undefined): EducationEntry[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((entry) => ({
        degree: asString(entry.degree),
        institution: asString(entry.institution),
        year: asString(entry.year),
      }))
    : [];

const parseProjectEntries = (value: unknown[] | null | undefined): ProjectEntry[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((entry) => ({
        name: asString(entry.name),
        title: asString(entry.title),
        description: asString(entry.description),
        technologies: asStringArray(entry.technologies),
      }))
    : [];

const appendPersonalInfoSection = (
  sections: string[],
  personalInfo?: Record<string, unknown> | null,
) => {
  if (!personalInfo) {
    return;
  }
  sections.push("Personal Information:");
  sections.push(JSON.stringify(personalInfo, null, 2));
};

const appendSummarySection = (sections: string[], summary?: string | null) => {
  if (!summary) {
    return;
  }
  sections.push("\nSummary:");
  sections.push(summary);
};

const appendExperienceSection = (sections: string[], entries: ExperienceEntry[]) => {
  if (entries.length === 0) {
    return;
  }

  sections.push("\nWork Experience:");
  for (const [index, exp] of entries.entries()) {
    sections.push(`\n${index + 1}. ${exp.title || "Position"} at ${exp.company || "Company"}`);
    if (exp.duration) {
      sections.push(`   Duration: ${exp.duration}`);
    }
    if (exp.description) {
      sections.push(`   ${exp.description}`);
    }
    if (!(exp.achievements && exp.achievements.length > 0)) {
      continue;
    }
    sections.push("   Achievements:");
    for (const achievement of exp.achievements) {
      sections.push(`   - ${achievement}`);
    }
  }
};

const appendEducationSection = (sections: string[], entries: EducationEntry[]) => {
  if (entries.length === 0) {
    return;
  }

  sections.push("\nEducation:");
  for (const [index, entry] of entries.entries()) {
    sections.push(
      `${index + 1}. ${entry.degree || "Degree"} - ${entry.institution || "Institution"}`,
    );
    if (entry.year) {
      sections.push(`   Year: ${entry.year}`);
    }
  }
};

const appendSkillsSection = (sections: string[], skills?: Record<string, unknown> | null) => {
  if (!skills) {
    return;
  }
  sections.push("\nSkills:");
  sections.push(JSON.stringify(skills, null, 2));
};

const appendProjectsSection = (sections: string[], entries: ProjectEntry[]) => {
  if (entries.length === 0) {
    return;
  }

  sections.push("\nProjects:");
  for (const [index, project] of entries.entries()) {
    sections.push(`\n${index + 1}. ${project.name || project.title || "Project"}`);
    if (project.description) {
      sections.push(`   ${project.description}`);
    }
    if (project.technologies && project.technologies.length > 0) {
      sections.push(`   Technologies: ${project.technologies.join(", ")}`);
    }
  }
};

const appendGamingExperienceSection = (
  sections: string[],
  gamingExperience?: Record<string, unknown> | null,
) => {
  if (!gamingExperience) {
    return;
  }
  sections.push("\nGaming Experience:");
  sections.push(JSON.stringify(gamingExperience, null, 2));
};

const buildResumeJobDescription = (job: typeof jobs.$inferSelect): string =>
  `
Title: ${job.title}
Company: ${job.company}
Description: ${job.description || ""}
Requirements: ${job.requirements?.join(", ") || ""}
Technologies: ${job.technologies?.join(", ") || ""}
  `.trim();

export function serializeResume(resume: ResumeRecord): string {
  const sections: string[] = [];
  appendPersonalInfoSection(sections, resume.personalInfo);
  appendSummarySection(sections, resume.summary);
  appendExperienceSection(sections, parseExperienceEntries(resume.experience));
  appendEducationSection(sections, parseEducationEntries(resume.education));
  appendSkillsSection(sections, resume.skills);
  appendProjectsSection(sections, parseProjectEntries(resume.projects));
  appendGamingExperienceSection(sections, resume.gamingExperience);
  return sections.join("\n");
}

export const buildAnalyzeResumePrompt = (resumeText: string, jobDescription: string): string => {
  if (jobDescription.length > 0) {
    return `${resumeScorePrompt(resumeText, jobDescription)}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), improvements (string[]), keywords (string[]).`;
  }
  return `${resumeEnhancePrompt(resumeText)}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), improvements (string[]), keywords (string[]).`;
};

export const buildCoverLetterPrompt = (
  company: string,
  position: string,
  jobDescription: string,
  resumeText: string,
): string => coverLetterPrompt(company, position, jobDescription, resumeText);

export const resolveAnalyzeResumeJobDescription = async (jobId?: string): Promise<string> => {
  if (!jobId) {
    return "";
  }
  const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
  return jobRows.length > 0 ? buildResumeJobDescription(jobRows[0]) : "";
};

export const resolveCoverLetterJobDescription = async (jobId?: string): Promise<string> => {
  if (!jobId) {
    return JOB_DESCRIPTION_UNAVAILABLE;
  }
  const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (jobRows.length === 0) {
    return JOB_DESCRIPTION_UNAVAILABLE;
  }
  return jobRows[0].description || JOB_DESCRIPTION_UNAVAILABLE;
};

export const parseResumeAnalysisResult = (content: string): ResumeAnalysisResult => {
  const parsed = parseJsonRecord(content);
  return {
    score: asNumber(parsed?.score) ?? DEFAULT_ANALYZE_RESUME_RESPONSE.score,
    strengths: asStringArray(parsed?.strengths),
    improvements: asStringArray(parsed?.improvements),
    keywords: asStringArray(parsed?.keywords),
  };
};

export const parseCoverLetterSections = (content: string): CoverLetterSections => {
  const parsed = parseJsonRecord(content);
  return {
    introduction: asString(parsed?.introduction) ?? DEFAULT_COVER_LETTER_RESPONSE.introduction,
    body: asString(parsed?.body) ?? DEFAULT_COVER_LETTER_RESPONSE.body,
    conclusion: asString(parsed?.conclusion) ?? DEFAULT_COVER_LETTER_RESPONSE.conclusion,
  };
};

export const extractResumeSkills = (resume: Pick<ResumeRecord, "skills">): string[] =>
  resume.skills ? Object.values(resume.skills).flatMap((value) => collectStringArray(value)) : [];

const collectStringArray = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => collectStringArray(entry));
};
