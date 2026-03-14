import {
  isResumeTemplate,
  JOB_QUERY_DEFAULT_LIMIT,
  RESUME_DEFAULT_NAME,
  RESUME_TEMPLATE_DEFAULT,
} from "@bao/shared";
import { like, or } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import { studios } from "../db/schema/studios";

type SearchType = "jobs" | "studios" | "skills" | "resumes";

const DEFAULT_SEARCH_TYPES: SearchType[] = ["jobs", "studios", "skills", "resumes"];
const ROLE_AUTOCOMPLETE_OPTIONS = [
  "Game Designer",
  "Level Designer",
  "Systems Designer",
  "Narrative Designer",
  "Quest Designer",
  "Combat Designer",
  "Economy Designer",
  "UI/UX Designer",
  "Gameplay Programmer",
  "Engine Programmer",
  "Graphics Programmer",
  "AI Programmer",
  "Network Programmer",
  "Tools Programmer",
  "Build Engineer",
  "Technical Artist",
  "Concept Artist",
  "3D Modeler",
  "Animator",
  "VFX Artist",
  "Environment Artist",
  "Character Artist",
  "Texture Artist",
  "Sound Designer",
  "Music Composer",
  "Audio Engineer",
  "Producer",
  "Associate Producer",
  "Executive Producer",
  "QA Tester",
  "QA Lead",
  "QA Automation Engineer",
  "Community Manager",
  "DevOps Engineer",
  "Data Analyst",
  "Live Ops Manager",
  "Monetization Designer",
  "Localization Specialist",
  "Art Director",
  "Creative Director",
  "Technical Director",
  "Game Director",
  "Studio Head",
  "Project Manager",
] as const;
const TECHNOLOGY_AUTOCOMPLETE_OPTIONS = [
  "Unity",
  "Unreal Engine",
  "Godot",
  "CryEngine",
  "Frostbite",
  "C++",
  "C#",
  "Python",
  "Lua",
  "TypeScript",
  "JavaScript",
  "Rust",
  "Maya",
  "Blender",
  "3ds Max",
  "ZBrush",
  "Houdini",
  "Substance",
  "DirectX",
  "Vulkan",
  "OpenGL",
  "HLSL",
  "GLSL",
  "Perforce",
  "Git",
  "Jira",
  "Figma",
  "Photoshop",
] as const;

interface SearchResult {
  type: SearchType;
  id: string;
  title: string;
  subtitle: string;
  snippet: string;
  relevance: number;
}

export interface UnifiedSearchResult {
  query: string;
  results: SearchResult[];
  counts: Record<SearchType, number>;
  totalTime: number;
}

export class SearchService {
  private async runTableQuery<T>(operation: () => Promise<T>): Promise<T | null> {
    return operation().then(
      (value) => value,
      () => null,
    );
  }

  private async searchJobs(query: string, pattern: string): Promise<SearchResult[]> {
    const jobRows = await this.runTableQuery(() =>
      db
        .select()
        .from(jobs)
        .where(
          or(
            like(jobs.title, pattern),
            like(jobs.company, pattern),
            like(jobs.description, pattern),
          ),
        )
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!jobRows) {
      return [];
    }
    const queryLower = query.toLowerCase();
    return jobRows.map((job) => ({
      type: "jobs",
      id: job.id,
      title: job.title || "",
      subtitle: job.company || "",
      snippet: job.description?.slice(0, 150) || "",
      relevance: job.title?.toLowerCase().includes(queryLower) ? 1.0 : 0.6,
    }));
  }

  private async searchStudios(pattern: string, query: string): Promise<SearchResult[]> {
    const studioRows = await this.runTableQuery(() =>
      db
        .select()
        .from(studios)
        .where(
          or(
            like(studios.name, pattern),
            like(studios.description, pattern),
            like(studios.location, pattern),
          ),
        )
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!studioRows) {
      return [];
    }
    const queryLower = query.toLowerCase();
    return studioRows.map((studio) => ({
      type: "studios",
      id: studio.id,
      title: studio.name || "",
      subtitle: `${studio.location || ""} · ${studio.type || ""}`,
      snippet: studio.description?.slice(0, 150) || "",
      relevance: studio.name?.toLowerCase().includes(queryLower) ? 1.0 : 0.5,
    }));
  }

  private async searchSkills(pattern: string): Promise<SearchResult[]> {
    const skillRows = await this.runTableQuery(() =>
      db
        .select()
        .from(skillMappings)
        .where(
          or(
            like(skillMappings.gameExpression, pattern),
            like(skillMappings.transferableSkill, pattern),
          ),
        )
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!skillRows) {
      return [];
    }
    return skillRows.map((skill) => ({
      type: "skills",
      id: skill.id,
      title: skill.gameExpression || "",
      subtitle: skill.transferableSkill || "",
      snippet: `Category: ${skill.category || "General"} · Confidence: ${skill.confidence || 0}`,
      relevance: 0.7,
    }));
  }

  private async searchResumes(pattern: string): Promise<SearchResult[]> {
    const resumeRows = await this.runTableQuery(() =>
      db
        .select()
        .from(resumes)
        .where(or(like(resumes.name, pattern), like(resumes.summary, pattern)))
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!resumeRows) {
      return [];
    }
    return resumeRows.map((resume) => ({
      type: "resumes",
      id: resume.id,
      title: resume.name || RESUME_DEFAULT_NAME,
      subtitle: isResumeTemplate(resume.template) ? resume.template : RESUME_TEMPLATE_DEFAULT,
      snippet: resume.summary?.slice(0, 150) || "",
      relevance: 0.7,
    }));
  }

  private collectAutocomplete(
    lowerPrefix: string,
    options: readonly string[],
    type: string,
  ): Array<{ text: string; type: string }> {
    return options
      .filter((option) => option.toLowerCase().includes(lowerPrefix))
      .map((option) => ({ text: option, type }));
  }

  async searchAll(query: string, types?: SearchType[]): Promise<UnifiedSearchResult> {
    const startTime = Date.now();
    const searchTypes = types || DEFAULT_SEARCH_TYPES;
    const pattern = `%${query}%`;
    const counts: Record<SearchType, number> = { jobs: 0, studios: 0, skills: 0, resumes: 0 };

    const batches = await Promise.all(
      searchTypes.map(async (type) => {
        if (type === "jobs") return { type, results: await this.searchJobs(query, pattern) };
        if (type === "studios") return { type, results: await this.searchStudios(pattern, query) };
        if (type === "skills") return { type, results: await this.searchSkills(pattern) };
        return { type, results: await this.searchResumes(pattern) };
      }),
    );

    const results: SearchResult[] = batches.flatMap((batch) => {
      counts[batch.type] = batch.results.length;
      return batch.results;
    });

    results.sort((a, b) => b.relevance - a.relevance);

    return {
      query,
      results,
      counts,
      totalTime: Date.now() - startTime,
    };
  }

  autocomplete(prefix: string): Array<{ text: string; type: string }> {
    if (prefix.length < 2) return [];

    const lower = prefix.toLowerCase();
    const suggestions = [
      ...this.collectAutocomplete(lower, ROLE_AUTOCOMPLETE_OPTIONS, "role"),
      ...this.collectAutocomplete(lower, TECHNOLOGY_AUTOCOMPLETE_OPTIONS, "technology"),
    ];

    return suggestions.slice(0, 10);
  }
}

export const searchService = new SearchService();
