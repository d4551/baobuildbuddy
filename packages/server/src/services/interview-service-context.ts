import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import { INTERVIEW_FALLBACK_STUDIO_ID } from "@bao/shared/constants/interview";
import type { InterviewCandidateContext, InterviewConfig } from "@bao/shared/types/interview";
import { DEFAULT_PROFILE_ID, DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { normalizeScrapePersonaEnrichment } from "@bao/shared/utils/scrape-enrichment";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { portfolioProjects, portfolios } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { settings } from "../db/schema/settings";
import { studios } from "../db/schema/studios";
import { userProfile } from "../db/schema/user";
import { decryptProviderKeys } from "../utils/settings-decrypt";
import { AIService } from "./ai/ai-service";
import type {
  CandidateInterviewContext,
  JsonRecord,
  StudioContext,
} from "./interview-service-contracts";
import { isRecord, parseString, parseStringArray } from "./interview-service-value-parsers";
const NUM_3 = 3;
const NUM_4 = 4;

type StudioRow = typeof studios.$inferSelect;

const firstPopulatedText = (...values: Array<string | null | undefined>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
};

const joinInterviewList = (values: string[], maxItems = 6): string => {
  const trimmed = values.map((value) => value.trim()).filter((value) => value.length > 0);
  if (trimmed.length === 0) {
    return DEFAULT_UNSPECIFIED_LABEL;
  }
  return trimmed.slice(0, maxItems).join(", ");
};

function toStudioContext(studio: StudioRow, fallbackStudio?: StudioRow): StudioContext {
  const studioTechnologies = parseStringArray(studio.technologies);
  const fallbackTechnologies = parseStringArray(fallbackStudio?.technologies);
  const studioGames = parseStringArray(studio.games);
  const fallbackGames = parseStringArray(fallbackStudio?.games);
  const studioCulture = isRecord(studio.culture) ? studio.culture : null;
  const fallbackCulture = isRecord(fallbackStudio?.culture) ? fallbackStudio.culture : null;
  const studioEnrichment = normalizeScrapePersonaEnrichment(studio.enrichment);
  const fallbackEnrichment = normalizeScrapePersonaEnrichment(fallbackStudio?.enrichment);

  return {
    id: studio.id,
    name: firstPopulatedText(studio.name, fallbackStudio?.name),
    description: firstPopulatedText(studio.description, fallbackStudio?.description),
    interviewStyle: firstPopulatedText(studio.interviewStyle, fallbackStudio?.interviewStyle),
    technologies: studioTechnologies.length > 0 ? studioTechnologies : fallbackTechnologies,
    games: studioGames.length > 0 ? studioGames : fallbackGames,
    culture: studioCulture ?? fallbackCulture ?? {},
    location: firstPopulatedText(studio.location, fallbackStudio?.location),
    type: firstPopulatedText(studio.type, fallbackStudio?.type),
    remoteWork:
      studio.remoteWork === true ||
      (studio.remoteWork !== false && fallbackStudio?.remoteWork === true),
    enrichment: studioEnrichment ?? fallbackEnrichment,
  };
}

function summarizeUserProfileContext(row: typeof userProfile.$inferSelect | undefined): string {
  if (!row) {
    return "Candidate profile: not provided.";
  }

  const gamingExperience = isRecord(row.gamingExperience) ? row.gamingExperience : null;
  const specializations = parseStringArray(gamingExperience?.specializations);
  const shippedTitles = Array.isArray(gamingExperience?.shippedTitles)
    ? gamingExperience.shippedTitles
        .filter((entry): entry is JsonRecord => isRecord(entry))
        .map((entry) => parseString(entry.name, ""))
        .filter((value) => value.length > 0)
    : [];

  return `Candidate profile:
- Name: ${parseString(row.name, DEFAULT_UNSPECIFIED_LABEL)}
- Current role: ${parseString(row.currentRole, DEFAULT_UNSPECIFIED_LABEL)}
- Current company: ${parseString(row.currentCompany, DEFAULT_UNSPECIFIED_LABEL)}
- Location: ${parseString(row.location, DEFAULT_UNSPECIFIED_LABEL)}
- Summary: ${parseString(row.summary, DEFAULT_UNSPECIFIED_LABEL)}
- Technical skills: ${joinInterviewList(row.technicalSkills ?? [])}
- Soft skills: ${joinInterviewList(row.softSkills ?? [])}
- Gaming specializations: ${joinInterviewList(specializations)}
- Shipped titles: ${joinInterviewList(shippedTitles, NUM_4)}`;
}

function summarizeResumeContext(row: typeof resumes.$inferSelect | undefined): string {
  if (!row) {
    return "Resume context: not provided.";
  }

  const experience = Array.isArray(row.experience)
    ? row.experience
        .filter((entry): entry is JsonRecord => isRecord(entry))
        .map((entry) =>
          [parseString(entry.title, ""), parseString(entry.company, "")]
            .filter((value) => value.length > 0)
            .join(" @ "),
        )
        .filter((value) => value.length > 0)
    : [];
  const projects = Array.isArray(row.projects)
    ? row.projects
        .filter((entry): entry is JsonRecord => isRecord(entry))
        .map((entry) => parseString(entry.title, ""))
        .filter((value) => value.length > 0)
    : [];
  const skills = isRecord(row.skills) ? row.skills : null;
  const technicalSkills = parseStringArray(skills?.technical);
  const softSkills = parseStringArray(skills?.soft);

  return `Resume context:
- Resume name: ${parseString(row.name, DEFAULT_UNSPECIFIED_LABEL)}
- Summary: ${parseString(row.summary, DEFAULT_UNSPECIFIED_LABEL)}
- Experience highlights: ${joinInterviewList(experience, NUM_4)}
- Project highlights: ${joinInterviewList(projects, NUM_4)}
- Technical skills: ${joinInterviewList(technicalSkills)}
- Soft skills: ${joinInterviewList(softSkills)}`;
}

function summarizeCoverLetterContext(row: typeof coverLetters.$inferSelect | undefined): string {
  if (!row) {
    return "Cover letter context: not provided.";
  }

  const content = isRecord(row.content) ? row.content : null;
  const opening = parseString(content?.opening, "");
  const body = parseString(content?.body, "");
  const closing = parseString(content?.closing, "");
  const combinedContent = [opening, body, closing].filter((value) => value.length > 0).join(" ");

  return `Cover letter context:
- Company: ${parseString(row.company, DEFAULT_UNSPECIFIED_LABEL)}
- Position: ${parseString(row.position, DEFAULT_UNSPECIFIED_LABEL)}
- Key narrative: ${combinedContent || DEFAULT_UNSPECIFIED_LABEL}`;
}

function summarizePortfolioContext(
  portfolioRow: typeof portfolios.$inferSelect | undefined,
  projectRows: Array<typeof portfolioProjects.$inferSelect>,
): string {
  if (!portfolioRow) {
    return "Portfolio context: not provided.";
  }

  const metadata = isRecord(portfolioRow.metadata) ? portfolioRow.metadata : null;
  const featuredProjects = projectRows
    .slice()
    .sort((left, right) => Number(right.featured) - Number(left.featured))
    .map((project) => {
      const technologies = Array.isArray(project.technologies)
        ? joinInterviewList(project.technologies, NUM_3)
        : DEFAULT_UNSPECIFIED_LABEL;
      return `${project.title} (${parseString(project.role, "Role not specified")}; tech: ${technologies})`;
    });

  return `Portfolio context:
- Portfolio title: ${parseString(metadata?.title, DEFAULT_UNSPECIFIED_LABEL)}
- Portfolio summary: ${parseString(metadata?.description, parseString(metadata?.bio, DEFAULT_UNSPECIFIED_LABEL))}
- Featured work: ${joinInterviewList(featuredProjects, NUM_3)}`;
}

async function resolvePreferredResume(candidateContext?: InterviewCandidateContext) {
  if (candidateContext?.resumeId) {
    const rows = await db.select().from(resumes).where(eq(resumes.id, candidateContext.resumeId));
    if (rows[0]) {
      return rows[0];
    }
  }

  const defaultRows = await db.select().from(resumes).where(eq(resumes.isDefault, true));
  if (defaultRows[0]) {
    return defaultRows[0];
  }

  const rows = await db.select().from(resumes).limit(1);
  return rows[0];
}

async function resolvePreferredCoverLetter(candidateContext?: InterviewCandidateContext) {
  if (candidateContext?.coverLetterId) {
    const rows = await db
      .select()
      .from(coverLetters)
      .where(eq(coverLetters.id, candidateContext.coverLetterId));
    if (rows[0]) {
      return rows[0];
    }
  }

  const rows = await db.select().from(coverLetters).orderBy(desc(coverLetters.updatedAt)).limit(1);
  return rows[0];
}

async function resolvePreferredPortfolio(candidateContext?: InterviewCandidateContext) {
  const portfolioRows = candidateContext?.portfolioId
    ? await db.select().from(portfolios).where(eq(portfolios.id, candidateContext.portfolioId))
    : await db.select().from(portfolios).limit(1);
  const portfolioRow = portfolioRows[0];

  if (!portfolioRow) {
    const emptyProjectRows: Array<typeof portfolioProjects.$inferSelect> = [];
    return { projectRows: emptyProjectRows };
  }

  const projectRows = await db
    .select()
    .from(portfolioProjects)
    .where(eq(portfolioProjects.portfolioId, portfolioRow.id))
    .orderBy(desc(portfolioProjects.featured), portfolioProjects.sortOrder);
  return { portfolioRow, projectRows };
}

export async function resolveStudioContext(studioId: string): Promise<StudioContext> {
  const [studioRows, fallbackRows] = await Promise.all([
    db.select().from(studios).where(eq(studios.id, studioId)),
    db.select().from(studios).where(eq(studios.id, INTERVIEW_FALLBACK_STUDIO_ID)),
  ]);

  const fallbackStudio = fallbackRows[0];
  const requestedStudio = studioRows[0];

  if (requestedStudio) {
    return toStudioContext(requestedStudio, fallbackStudio);
  }

  if (fallbackStudio) {
    return toStudioContext(fallbackStudio, fallbackStudio);
  }

  throw new Error(
    `Missing fallback studio configuration in database: ${INTERVIEW_FALLBACK_STUDIO_ID}`,
  );
}

export async function createAIService(): Promise<AIService> {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return AIService.fromSettings({ ...settingsRows[0], ...decryptProviderKeys(settingsRows[0]) });
}

export async function resolveCandidateInterviewContext(
  config: InterviewConfig,
): Promise<CandidateInterviewContext> {
  const [profileRows, resumeRow, coverLetterRow, portfolioSnapshot] = await Promise.all([
    db.select().from(userProfile).where(eq(userProfile.id, DEFAULT_PROFILE_ID)).limit(1),
    resolvePreferredResume(config.candidateContext),
    resolvePreferredCoverLetter(config.candidateContext),
    resolvePreferredPortfolio(config.candidateContext),
  ]);

  return {
    conversationStyle: config.conversationStyle ?? "natural",
    profileSummary: summarizeUserProfileContext(profileRows[0]),
    resumeSummary: summarizeResumeContext(resumeRow),
    coverLetterSummary: summarizeCoverLetterContext(coverLetterRow),
    portfolioSummary: summarizePortfolioContext(
      portfolioSnapshot.portfolioRow,
      portfolioSnapshot.projectRows,
    ),
  };
}
