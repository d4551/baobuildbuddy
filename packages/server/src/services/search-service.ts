import { JOB_QUERY_DEFAULT_LIMIT } from "@bao/shared/constants/jobs";
import {
  DEFAULT_SEARCH_RESULT_TYPES,
  type SearchResultType,
} from "@bao/shared/constants/search";
import {
  isResumeTemplate,
  RESUME_DEFAULT_NAME,
  RESUME_TEMPLATE_DEFAULT,
} from "@bao/shared/constants/resume";
import type { SearchResult } from "@bao/shared/types/search";
import { settle } from "@bao/shared/utils/promise";
import { like, or } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { coverLetters } from "../db/schema/cover-letters";
import { interviewSessions } from "../db/schema/interviews";
import { jobs } from "../db/schema/jobs";
import { portfolioProjects } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import { studios } from "../db/schema/studios";
import { createServerLogger } from "../utils/logger";
import { getJobTaxonomy } from "./jobs/job-taxonomy-service";

type SearchType = SearchResultType;

const searchLogger = createServerLogger("search-service");

export interface UnifiedSearchResult {
  query: string;
  results: SearchResult[];
  counts: Record<SearchType, number>;
  totalTime: number;
}

const emptyCounts = (): Record<SearchType, number> => {
  const counts = {} as Record<SearchType, number>;
  for (const type of DEFAULT_SEARCH_RESULT_TYPES) {
    counts[type] = 0;
  }
  return counts;
};

export class SearchService {
  private async runTableQuery<T>(label: string, operation: () => Promise<T>): Promise<T | null> {
    const settled = await settle(operation());
    if (settled.status === "rejected") {
      searchLogger.warn("search table query failed", {
        label,
        err: settled.reason.message,
      });
      return null;
    }
    return settled.value;
  }

  private async searchJobs(query: string, pattern: string): Promise<SearchResult[]> {
    const jobRows = await this.runTableQuery("jobs", () =>
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
      type: "jobs" as const,
      id: job.id,
      title: job.title || "",
      subtitle: job.company || "",
      snippet: job.description?.slice(0, 150) || "",
      relevance: job.title?.toLowerCase().includes(queryLower) ? 1.0 : 0.6,
    }));
  }

  private async searchStudios(pattern: string, query: string): Promise<SearchResult[]> {
    const studioRows = await this.runTableQuery("studios", () =>
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
      type: "studios" as const,
      id: studio.id,
      title: studio.name || "",
      subtitle: `${studio.location || ""} · ${studio.type || ""}`,
      snippet: studio.description?.slice(0, 150) || "",
      relevance: studio.name?.toLowerCase().includes(queryLower) ? 1.0 : 0.5,
    }));
  }

  private async searchSkills(pattern: string): Promise<SearchResult[]> {
    const skillRows = await this.runTableQuery("skills", () =>
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
      type: "skills" as const,
      id: skill.id,
      title: skill.gameExpression || "",
      subtitle: skill.transferableSkill || "",
      snippet: `Category: ${skill.category || "General"} · Confidence: ${skill.confidence || 0}`,
      relevance: 0.7,
    }));
  }

  private async searchResumes(pattern: string): Promise<SearchResult[]> {
    const resumeRows = await this.runTableQuery("resumes", () =>
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
      type: "resumes" as const,
      id: resume.id,
      title: resume.name || RESUME_DEFAULT_NAME,
      subtitle: isResumeTemplate(resume.template) ? resume.template : RESUME_TEMPLATE_DEFAULT,
      snippet: resume.summary?.slice(0, 150) || "",
      relevance: 0.7,
    }));
  }

  private async searchCoverLetters(pattern: string): Promise<SearchResult[]> {
    const rows = await this.runTableQuery("cover-letters", () =>
      db
        .select()
        .from(coverLetters)
        .where(or(like(coverLetters.company, pattern), like(coverLetters.position, pattern)))
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!rows) {
      return [];
    }
    return rows.map((row) => ({
      type: "cover-letters" as const,
      id: row.id,
      title: row.position || "",
      subtitle: row.company || "",
      snippet: `${row.position} @ ${row.company}`,
      relevance: 0.75,
    }));
  }

  private async searchPortfolioProjects(pattern: string): Promise<SearchResult[]> {
    const rows = await this.runTableQuery("portfolio-projects", () =>
      db
        .select()
        .from(portfolioProjects)
        .where(
          or(like(portfolioProjects.title, pattern), like(portfolioProjects.description, pattern)),
        )
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!rows) {
      return [];
    }
    return rows.map((row) => ({
      type: "portfolio-projects" as const,
      id: row.id,
      title: row.title || "",
      subtitle: row.role || "",
      snippet: row.description?.slice(0, 150) || "",
      relevance: 0.7,
    }));
  }

  private async searchInterviewSessions(pattern: string): Promise<SearchResult[]> {
    const rows = await this.runTableQuery("interview-sessions", () =>
      db
        .select()
        .from(interviewSessions)
        .where(
          or(like(interviewSessions.studioId, pattern), like(interviewSessions.status, pattern)),
        )
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!rows) {
      return [];
    }
    return rows.map((row) => ({
      type: "interview-sessions" as const,
      id: row.id,
      title: `Interview · ${row.status || "unknown"}`,
      subtitle: row.studioId || "",
      snippet: `Session ${row.id}`,
      relevance: 0.55,
    }));
  }

  private async searchAutomationRuns(pattern: string): Promise<SearchResult[]> {
    const rows = await this.runTableQuery("automation-runs", () =>
      db
        .select()
        .from(automationRuns)
        .where(
          or(
            like(automationRuns.type, pattern),
            like(automationRuns.status, pattern),
            like(automationRuns.jobId, pattern),
            like(automationRuns.error, pattern),
          ),
        )
        .limit(JOB_QUERY_DEFAULT_LIMIT),
    );
    if (!rows) {
      return [];
    }
    return rows.map((row) => ({
      type: "automation-runs" as const,
      id: row.id,
      title: `${row.type} · ${row.status}`,
      subtitle: row.jobId || row.type,
      snippet: row.error?.slice(0, 150) || `Run ${row.id}`,
      relevance: 0.6,
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

  private async searchByType(
    type: SearchType,
    query: string,
    pattern: string,
  ): Promise<SearchResult[]> {
    if (type === "jobs") return this.searchJobs(query, pattern);
    if (type === "studios") return this.searchStudios(pattern, query);
    if (type === "skills") return this.searchSkills(pattern);
    if (type === "resumes") return this.searchResumes(pattern);
    if (type === "cover-letters") return this.searchCoverLetters(pattern);
    if (type === "portfolio-projects") return this.searchPortfolioProjects(pattern);
    if (type === "interview-sessions") return this.searchInterviewSessions(pattern);
    return this.searchAutomationRuns(pattern);
  }

  async searchAll(query: string, types?: SearchType[]): Promise<UnifiedSearchResult> {
    const startTime = Date.now();
    const searchTypes = types && types.length > 0 ? types : [...DEFAULT_SEARCH_RESULT_TYPES];
    const pattern = `%${query}%`;
    const counts = emptyCounts();

    const batches = await Promise.all(
      searchTypes.map(async (type) => ({
        type,
        results: await this.searchByType(type, query, pattern),
      })),
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
