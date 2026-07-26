import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { portfolioProjects, portfolios } from "../../db/schema/portfolios";
import { userProfile } from "../../db/schema/user";
import { type EntityPromptContext, loadEntityPromptContext } from "../ai/prompt-context-loader";

/**
 * Extra candidate context the smart-field mapper reads alongside the resume so
 * the AI can pre-fill ATS fields the resume's `personalInfo` does not cover
 * (LinkedIn, GitHub, portfolio URL, work authorization signals from the job
 * posting, etc.). Previously `jobId` was accepted by the apply route and stored
 * on the run row but never loaded, so the mapper was blind to the scraped job
 * and to the user's profile/portfolio/skill-mapping data even when present.
 */
export interface JobApplyCandidateContext {
  readonly jobContext?: string;
  readonly studioContext?: string;
  readonly skillContext?: string;
  readonly profileContext?: string;
  readonly portfolioContext?: string;
}

const PORTFOLIO_PROJECT_LIMIT = 3;

const isNonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const readString = (record: Record<string, unknown>, key: string): string =>
  isNonEmpty(record[key]) ? (record[key]).trim() : "";

const appendProfileField = (entries: string[], key: string, value: string | null): void => {
  if (isNonEmpty(value)) {
    entries.push(`${key}: ${value.trim()}`);
  }
};

const buildProfileContext = async (): Promise<string | undefined> => {
  const profileRows = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
  const profile = profileRows[0];
  if (!profile) {
    return undefined;
  }
  const entries: string[] = [];
  appendProfileField(entries, "name", profile.name);
  appendProfileField(entries, "email", profile.email);
  appendProfileField(entries, "phone", profile.phone);
  appendProfileField(entries, "location", profile.location);
  appendProfileField(entries, "website", profile.website);
  appendProfileField(entries, "linkedin", profile.linkedin);
  appendProfileField(entries, "github", profile.github);
  if (entries.length === 0) {
    return undefined;
  }
  return `User profile (fallback for resume personalInfo):\n${entries.join("\n")}`;
};

const readMetadataString = (metadata: unknown, key: string): string => {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }
  return readString(metadata as Record<string, unknown>, key);
};

const buildPortfolioContext = async (): Promise<string | undefined> => {
  const portfolioRows = await db.select().from(portfolios).limit(1);
  const portfolioRow = portfolioRows[0];
  if (!portfolioRow) {
    return undefined;
  }
  const lines: string[] = [];
  const portfolioUrl =
    readMetadataString(portfolioRow.metadata, "url") ||
    readMetadataString(portfolioRow.metadata, "website");
  if (portfolioUrl.length > 0) {
    lines.push(`Portfolio URL: ${portfolioUrl}`);
  }
  const projects = await db
    .select()
    .from(portfolioProjects)
    .where(eq(portfolioProjects.portfolioId, portfolioRow.id))
    .limit(PORTFOLIO_PROJECT_LIMIT);
  for (const project of projects) {
    const projectLine = [
      project.title,
      project.liveUrl ? `live: ${project.liveUrl}` : "",
      project.githubUrl ? `github: ${project.githubUrl}` : "",
    ]
      .filter((segment) => segment.length > 0)
      .join(" | ");
    if (projectLine.length > 0) {
      lines.push(`- ${projectLine}`);
    }
  }
  return lines.length > 0 ? `Portfolio:\n${lines.join("\n")}` : undefined;
};

const toCandidateContext = (
  entityContext: EntityPromptContext,
  profileContext: string | undefined,
  portfolioContext: string | undefined,
): JobApplyCandidateContext => ({
  ...(entityContext.jobContext ? { jobContext: entityContext.jobContext } : {}),
  ...(entityContext.studioContext ? { studioContext: entityContext.studioContext } : {}),
  ...(entityContext.skillContext ? { skillContext: entityContext.skillContext } : {}),
  ...(profileContext ? { profileContext } : {}),
  ...(portfolioContext ? { portfolioContext } : {}),
});

export const loadJobApplyCandidateContext = async (
  jobId?: string,
): Promise<JobApplyCandidateContext> => {
  const entityContextPromise = jobId
    ? loadEntityPromptContext({ jobId, includeSkills: true })
    : Promise.resolve<EntityPromptContext>({});
  const [entityContext, profileContext, portfolioContext] = await Promise.all([
    entityContextPromise,
    buildProfileContext(),
    buildPortfolioContext(),
  ]);
  return toCandidateContext(entityContext, profileContext, portfolioContext);
};
