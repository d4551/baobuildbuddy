import { like, or } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import { studios } from "../db/schema/studios";

type SearchType = "jobs" | "studios" | "skills" | "resumes";

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
  async searchAll(query: string, types?: SearchType[]): Promise<UnifiedSearchResult> {
    const startTime = Date.now();
    const searchTypes = types || ["jobs", "studios", "skills", "resumes"];
    const results: SearchResult[] = [];
    const counts: Record<SearchType, number> = { jobs: 0, studios: 0, skills: 0, resumes: 0 };
    const pattern = `%${query}%`;
    const runTableQuery = async <T>(operation: () => Promise<T>): Promise<T | null> =>
      operation().then(
        (value) => value,
        () => null,
      );

    if (searchTypes.includes("jobs")) {
      const jobResults = await runTableQuery(() =>
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
          .limit(20),
      );
      if (jobResults) {
        for (const job of jobResults) {
          const titleMatch = job.title?.toLowerCase().includes(query.toLowerCase());
          results.push({
            type: "jobs",
            id: job.id,
            title: job.title || "",
            subtitle: job.company || "",
            snippet: job.description?.slice(0, 150) || "",
            relevance: titleMatch ? 1.0 : 0.6,
          });
        }
        counts.jobs = jobResults.length;
      }
    }

    if (searchTypes.includes("studios")) {
      const studioResults = await runTableQuery(() =>
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
          .limit(20),
      );
      if (studioResults) {
        for (const studio of studioResults) {
          const nameMatch = studio.name?.toLowerCase().includes(query.toLowerCase());
          results.push({
            type: "studios",
            id: studio.id,
            title: studio.name || "",
            subtitle: `${studio.location || ""} · ${studio.type || ""}`,
            snippet: studio.description?.slice(0, 150) || "",
            relevance: nameMatch ? 1.0 : 0.5,
          });
        }
        counts.studios = studioResults.length;
      }
    }

    if (searchTypes.includes("skills")) {
      const skillResults = await runTableQuery(() =>
        db
          .select()
          .from(skillMappings)
          .where(
            or(
              like(skillMappings.gameExpression, pattern),
              like(skillMappings.transferableSkill, pattern),
            ),
          )
          .limit(20),
      );
      if (skillResults) {
        for (const skill of skillResults) {
          results.push({
            type: "skills",
            id: skill.id,
            title: skill.gameExpression || "",
            subtitle: skill.transferableSkill || "",
            snippet: `Category: ${skill.category || "General"} · Confidence: ${skill.confidence || 0}`,
            relevance: 0.7,
          });
        }
        counts.skills = skillResults.length;
      }
    }

    if (searchTypes.includes("resumes")) {
      const resumeResults = await runTableQuery(() =>
        db
          .select()
          .from(resumes)
          .where(or(like(resumes.name, pattern), like(resumes.summary, pattern)))
          .limit(20),
      );
      if (resumeResults) {
        for (const resume of resumeResults) {
          results.push({
            type: "resumes",
            id: resume.id,
            title: resume.name || "Untitled",
            subtitle: resume.template || "modern",
            snippet: resume.summary?.slice(0, 150) || "",
            relevance: 0.7,
          });
        }
        counts.resumes = resumeResults.length;
      }
    }

    // Sort by relevance
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
    const suggestions: Array<{ text: string; type: string }> = [];

    // Job titles
    const titles = [
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
    ];

    for (const title of titles) {
      if (title.toLowerCase().includes(lower)) {
        suggestions.push({ text: title, type: "role" });
      }
    }

    // Technologies
    const techs = [
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
    ];

    for (const tech of techs) {
      if (tech.toLowerCase().includes(lower)) {
        suggestions.push({ text: tech, type: "technology" });
      }
    }

    return suggestions.slice(0, 10);
  }
}

export const searchService = new SearchService();
