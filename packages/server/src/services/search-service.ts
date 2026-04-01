import { JOB_QUERY_DEFAULT_LIMIT } from "@bao/shared/constants/jobs";
import {
  RESUME_DEFAULT_NAME,
  RESUME_TEMPLATE_DEFAULT,
  isResumeTemplate,
} from "@bao/shared/constants/resume";
import { like, or } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import { studios } from "../db/schema/studios";
import { getJobTaxonomy } from "./jobs/job-taxonomy-service";

type SearchType = "jobs" | "studios" | "skills" | "resumes";

const DEFAULT_SEARCH_TYPES: SearchType[] = ["jobs", "studios", "skills", "resumes"];
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

  async autocomplete(prefix: string): Promise<Array<{ text: string; type: string }>> {
    if (prefix.length < 2) return [];

    const taxonomy = await getJobTaxonomy();
    const lower = prefix.toLowerCase();
    const roleOptions = taxonomy.keywords
      .filter((entry) => entry.enabled && entry.category === "role")
      .map((entry) => entry.label);
    const technologyOptions = taxonomy.keywords
      .filter((entry) => entry.enabled && entry.category === "technology")
      .map((entry) => entry.label);
    const suggestions = [
      ...this.collectAutocomplete(lower, roleOptions, "role"),
      ...this.collectAutocomplete(lower, technologyOptions, "technology"),
    ];

    return suggestions.slice(0, 10);
  }
}

export const searchService = new SearchService();
