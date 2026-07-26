import type { InterviewTargetJob } from "@bao/shared/types/interview";
import type { ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { jobs } from "../../db/schema/jobs";
import { studios } from "../../db/schema/studios";
import { skillMappingService } from "../skill-mapping-service";
import {
  buildJobPromptContext,
  buildSkillPromptContext,
  buildStudioPromptContext,
  type StudioPromptContext,
} from "./prompt-context-entities";

/**
 * Loads the studio / job / skill blocks an AI surface needs, from ids.
 *
 * Cover letters and resume enhancement previously had no way to reach this data —
 * they only received whatever the client hand-marshalled — so their prompts were
 * blind to the scraped studios and postings sitting in the database. Unlike the
 * interview loader (`interview-service-context.ts:resolveStudioContext`) this one
 * does NOT substitute a fallback studio: for a cover letter, a missing studio must
 * read as "no studio context" rather than quietly describing a different company.
 */

export interface EntityPromptContext {
  readonly studioContext?: string;
  readonly jobContext?: string;
  readonly skillContext?: string;
}

export interface EntityPromptContextRequest {
  readonly jobId?: string | undefined;
  readonly studioId?: string | undefined;
  readonly includeSkills?: boolean;
}

type StudioRow = typeof studios.$inferSelect;
type JobRow = typeof jobs.$inferSelect;

/** JSON columns are declared `$type<string[]>()` but are nullable in SQLite. */
const toStringArray = (value: readonly string[] | null): readonly string[] => value ?? [];

const withEnrichment = (
  enrichment: ScrapePersonaEnrichment | null,
): { enrichment?: ScrapePersonaEnrichment } => (enrichment ? { enrichment } : {});

const toStudioPromptContext = (studio: StudioRow): StudioPromptContext => ({
  name: studio.name,
  description: studio.description ?? "",
  interviewStyle: studio.interviewStyle ?? "",
  technologies: toStringArray(studio.technologies),
  games: toStringArray(studio.games),
  location: studio.location ?? "",
  type: studio.type ?? "",
  remoteWork: studio.remoteWork === true,
  ...withEnrichment(studio.enrichment),
});

const toTargetJob = (job: JobRow): InterviewTargetJob => ({
  id: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  ...(job.description ? { description: job.description } : {}),
  requirements: [...toStringArray(job.requirements)],
  technologies: [...toStringArray(job.technologies)],
  ...(job.source ? { source: job.source } : {}),
  ...withEnrichment(job.enrichment),
});

/**
 * When only a job id is supplied, the job's own company name is used to find the
 * studio, so a cover letter written from a scraped posting still carries studio
 * culture and tech-stack detail without the caller knowing the studio id.
 */
const resolveStudioRow = async (
  studioId: string | undefined,
  jobRow: JobRow | undefined,
): Promise<StudioRow | undefined> => {
  if (studioId) {
    const rows = await db.select().from(studios).where(eq(studios.id, studioId));
    if (rows[0]) {
      return rows[0];
    }
  }
  if (jobRow) {
    const rows = await db.select().from(studios).where(eq(studios.name, jobRow.company));
    return rows[0];
  }
  return undefined;
};

export const loadEntityPromptContext = async (
  request: EntityPromptContextRequest,
): Promise<EntityPromptContext> => {
  const jobRows = request.jobId
    ? await db.select().from(jobs).where(eq(jobs.id, request.jobId))
    : [];
  const jobRow = jobRows[0];
  const studioRow = await resolveStudioRow(request.studioId, jobRow);
  const skills = request.includeSkills === true ? await skillMappingService.getMappings() : [];

  return {
    ...(studioRow
      ? { studioContext: buildStudioPromptContext(toStudioPromptContext(studioRow)) }
      : {}),
    ...(jobRow ? { jobContext: buildJobPromptContext(toTargetJob(jobRow)) } : {}),
    ...(skills.length > 0 ? { skillContext: buildSkillPromptContext(skills) } : {}),
  };
};

/**
 * Flattens an entity context into a single prompt block. Returns undefined when
 * no context is present so callers can skip the section entirely.
 */
export const serializeEntityPromptContext = (context: EntityPromptContext): string | undefined => {
  const sections = [context.studioContext, context.jobContext, context.skillContext].filter(
    (section): section is string => typeof section === "string" && section.trim().length > 0,
  );
  return sections.length > 0 ? sections.join("\n\n") : undefined;
};
