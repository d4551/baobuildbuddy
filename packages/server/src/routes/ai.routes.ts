import type { AIChatContext, AIChatContextDomain } from "@bao/shared";
import {
  AI_CHAT_CONTEXT_DOMAIN_IDS,
  AI_CHAT_CONTEXT_ENTITY_TYPE_IDS,
  AI_CHAT_CONTEXT_SOURCE_IDS,
  AI_CHAT_CONTEXT_TAIL_LIMIT,
  AI_CHAT_RECENT_JOBS_LIMIT,
  AI_DEFAULT_TEMPERATURE,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  AI_MAX_TOKENS_CHAT,
  AI_PROVIDER_CATALOG,
  API_ERROR_ANALYZE_RESUME,
  API_ERROR_GENERATE_AI_RESPONSE,
  API_ERROR_GENERATE_COVER_LETTER,
  API_ERROR_MATCH_JOBS,
  API_ERROR_RESUME_NOT_FOUND,
  API_ERROR_UNSUPPORTED_AUTOMATION_ACTION,
  API_MESSAGE_AI_NO_JOBS_FOR_MATCHING,
  API_MESSAGE_AI_NO_PROVIDERS,
  API_MESSAGE_COVER_LETTER_GENERATED,
  API_MESSAGE_JOB_MATCHING_COMPLETE,
  API_MESSAGE_RESUME_ANALYSIS_COMPLETE,
  asString,
  asStringArray,
  DEFAULT_PROFILE_ID,
  DEFAULT_SCORE_NEUTRAL,
  generateId,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  inferAIChatDomainFromRoutePath,
  isRecord,
  MS_PER_MINUTE,
  resolveBrandSettings,
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_DEVICE,
  SCHEMA_MAX_LENGTH_ENTITY_TYPE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_SOURCE,
  SCHEMA_MAX_LENGTH_URL,
  safeParseJson,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { buildAIControlPlaneState } from "../services/ai/control-plane";
import { contextManager } from "../services/ai/context-manager";
import {
  buildSystemPrompt,
  coverLetterPrompt,
  jobMatchPrompt,
  resumeEnhancePrompt,
  resumeScorePrompt,
} from "../services/ai/prompts";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { mapAutomationRouteError } from "../utils/automation-route-error";
import { createServerLogger } from "../utils/logger";
import { resolveRateLimitClientKey } from "../utils/request";

const aiRoutesLogger = createServerLogger("ai-routes");

/**
 * Helper function to load settings and create AI service
 */
async function getAISettingsRow() {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return settingsRows[0];
}

async function getAIService(settingsRow?: Awaited<ReturnType<typeof getAISettingsRow>>) {
  const resolvedSettingsRow = settingsRow ?? (await getAISettingsRow());
  const aiService = AIService.fromSettings(resolvedSettingsRow);
  return aiService;
}

async function buildProviderModelsResponse() {
  const settingsRow = await getAISettingsRow();
  if (!settingsRow) {
    return {
      providers: AI_PROVIDER_CATALOG.map((provider) => ({
        id: provider.id,
        nameKey: provider.nameKey,
        descriptionKey: provider.descriptionKey,
        iconId: provider.iconId,
        models: [...provider.modelHints],
        available: false,
        health: "unconfigured" as const,
      })),
      error: API_MESSAGE_AI_NO_PROVIDERS,
    };
  }

  return buildAIControlPlaneState(settingsRow);
}

/**
 * Helper to safely parse JSON from AI responses
 */
function safeJSONParse<T>(jsonString: string, fallback: T): T {
  const cleaned = jsonString
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = safeParseJson(cleaned);
  if (parsed === null) {
    aiRoutesLogger.error("Failed to parse AI JSON response");
    return fallback;
  }
  return parsed as T;
}

const collectStringArray = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => collectStringArray(entry));
};

const chatContextSchema = t.Object({
  source: t.String({ maxLength: SCHEMA_MAX_LENGTH_SOURCE }),
  domain: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SOURCE })),
  route: t.Object({
    path: t.String({ maxLength: SCHEMA_MAX_LENGTH_URL }),
    name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
    params: t.Record(t.String(), t.String()),
    query: t.Record(t.String(), t.String()),
  }),
  entity: t.Optional(
    t.Object({
      type: t.String({ maxLength: SCHEMA_MAX_LENGTH_ENTITY_TYPE }),
      id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      label: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    }),
  ),
  state: t.Object({
    hasResumes: t.Boolean(),
    resumeCount: t.Number(),
    hasJobs: t.Boolean(),
    jobCount: t.Number(),
    hasStudios: t.Boolean(),
    studioCount: t.Number(),
    hasInterviewSessions: t.Boolean(),
    interviewSessionCount: t.Number(),
    hasPortfolioProjects: t.Boolean(),
    portfolioProjectCount: t.Number(),
  }),
});

const aiPreferenceSchema = t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean()]));

type ChatContextPayload = typeof chatContextSchema.static;

const isValidChatContextSource = (value: string): value is AIChatContext["source"] =>
  AI_CHAT_CONTEXT_SOURCE_IDS.includes(value as AIChatContext["source"]);

const isValidChatContextDomain = (value: string): value is NonNullable<AIChatContext["domain"]> =>
  AI_CHAT_CONTEXT_DOMAIN_IDS.includes(value as NonNullable<AIChatContext["domain"]>);

const isValidChatContextEntityType = (
  value: string,
): value is NonNullable<AIChatContext["entity"]>["type"] =>
  AI_CHAT_CONTEXT_ENTITY_TYPE_IDS.includes(value as NonNullable<AIChatContext["entity"]>["type"]);

/**
 * Normalize optional client context payload into strict shared AIChatContext shape.
 */
function normalizeClientChatContext(context?: ChatContextPayload): AIChatContext | null {
  if (!(context && isValidChatContextSource(context.source))) {
    return null;
  }

  const fallbackDomain = inferAIChatDomainFromRoutePath(context.route.path);
  const domain =
    typeof context.domain === "string" && isValidChatContextDomain(context.domain)
      ? context.domain
      : fallbackDomain;

  const routeName =
    typeof context.route.name === "string" && context.route.name.trim().length > 0
      ? context.route.name
      : undefined;

  const normalizedContext: AIChatContext = {
    source: context.source,
    domain,
    route: {
      path: context.route.path,
      ...(routeName ? { name: routeName } : {}),
      params: context.route.params,
      query: context.route.query,
    },
    state: context.state,
  };

  if (context.entity && isValidChatContextEntityType(context.entity.type)) {
    const normalizedLabel =
      typeof context.entity.label === "string" && context.entity.label.trim().length > 0
        ? context.entity.label
        : undefined;

    normalizedContext.entity = {
      type: context.entity.type,
      id: context.entity.id,
      ...(normalizedLabel ? { label: normalizedLabel } : {}),
    };
  }

  return normalizedContext;
}

/**
 * Serialize client chat context for prompt injection.
 */
function serializeClientChatContext(context: AIChatContext): string {
  const lines: string[] = [
    `Client Source: ${context.source}`,
    `Route Path: ${context.route.path}`,
    `Route Domain: ${context.domain ?? inferAIChatDomainFromRoutePath(context.route.path)}`,
    `State Snapshot: hasResumes=${context.state.hasResumes}, resumeCount=${context.state.resumeCount}, hasJobs=${context.state.hasJobs}, jobCount=${context.state.jobCount}, hasStudios=${context.state.hasStudios}, studioCount=${context.state.studioCount}, hasInterviewSessions=${context.state.hasInterviewSessions}, interviewSessionCount=${context.state.interviewSessionCount}, hasPortfolioProjects=${context.state.hasPortfolioProjects}, portfolioProjectCount=${context.state.portfolioProjectCount}`,
  ];

  if (context.route.name) {
    lines.push(`Route Name: ${context.route.name}`);
  }

  if (Object.keys(context.route.params).length > 0) {
    lines.push(`Route Params: ${JSON.stringify(context.route.params)}`);
  }

  if (Object.keys(context.route.query).length > 0) {
    lines.push(`Route Query: ${JSON.stringify(context.route.query)}`);
  }

  if (context.entity) {
    const baseEntityLine = `Focused Entity: ${context.entity.type} (${context.entity.id})`;
    lines.push(
      context.entity.label ? `${baseEntityLine} - ${context.entity.label}` : baseEntityLine,
    );
  }

  return lines.join("\n");
}

/**
 * Build final system prompt using static prompt, server context, and optional client context.
 */
function composeChatSystemPrompt(
  basePrompt: string,
  contextualPrompt: string,
  clientContext: AIChatContext | null,
): string {
  const promptSections = [basePrompt, contextualPrompt];
  if (clientContext) {
    promptSections.push(`Client UI Context:\n${serializeClientChatContext(clientContext)}`);
  }
  return promptSections.join("\n\n");
}

interface ExperienceEntry {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
  achievements?: string[];
  [key: string]: unknown;
}

interface EducationEntry {
  degree?: string;
  institution?: string;
  year?: string;
  [key: string]: unknown;
}

interface ProjectEntry {
  name?: string;
  title?: string;
  description?: string;
  technologies?: string[];
  [key: string]: unknown;
}

/**
 * Loosely-typed resume record coming from the database.
 * We deliberately keep this permissive so that `serializeResume` works
 * regardless of the exact Drizzle row shape.
 */
interface ResumeRecord {
  personalInfo?: Record<string, unknown> | null;
  summary?: string | null;
  experience?: unknown[] | null;
  education?: unknown[] | null;
  skills?: Record<string, unknown> | null;
  projects?: unknown[] | null;
  gamingExperience?: Record<string, unknown> | null;
  [key: string]: unknown;
}

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

type ChatHistoryInsert = typeof chatHistory.$inferInsert;
type JobRow = typeof jobs.$inferSelect;
type MatchJobsResponse = {
  message: string;
  matches: Array<{
    jobId: string;
    title: string;
    company: string;
    location: string | null;
    remote: boolean;
    score: number;
    strengths: string[];
    concerns: string[];
    highlightSkills: string[];
  }>;
  recommendations: string[];
};
type AnalyzeResumeBody = {
  resumeId: string;
  jobId?: string;
};
type GenerateCoverLetterBody = {
  resumeId: string;
  jobId?: string;
  company: string;
  position: string;
};
type MatchJobsBody = {
  resumeId?: string;
  skills?: string[];
};
type RouteSetState = {
  status?: number | string;
};
type MatchProfile = {
  userSkills: string[];
  experience: string;
  goals: string;
};
type CoverLetterSections = {
  introduction: string;
  body: string;
  conclusion: string;
};
type ResumeAnalysisResult = {
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
};

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

const createChatMessage = (
  role: "user" | "assistant",
  content: string,
  sessionId: string,
): ChatHistoryInsert => ({
  id: generateId(),
  role,
  content,
  timestamp: new Date().toISOString(),
  sessionId,
});

const appendPersonalInfoSection = (
  sections: string[],
  personalInfo?: Record<string, unknown> | null,
) => {
  if (!personalInfo) return;
  sections.push("Personal Information:");
  sections.push(JSON.stringify(personalInfo, null, 2));
};

const appendSummarySection = (sections: string[], summary?: string | null) => {
  if (!summary) return;
  sections.push("\nSummary:");
  sections.push(summary);
};

const appendExperienceSection = (sections: string[], entries: ExperienceEntry[]) => {
  if (entries.length === 0) return;

  sections.push("\nWork Experience:");
  for (const [index, exp] of entries.entries()) {
    sections.push(`\n${index + 1}. ${exp.title || "Position"} at ${exp.company || "Company"}`);
    if (exp.duration) sections.push(`   Duration: ${exp.duration}`);
    if (exp.description) sections.push(`   ${exp.description}`);
    if (!(exp.achievements && exp.achievements.length > 0)) continue;
    sections.push("   Achievements:");
    for (const achievement of exp.achievements) {
      sections.push(`   - ${achievement}`);
    }
  }
};

const appendEducationSection = (sections: string[], entries: EducationEntry[]) => {
  if (entries.length === 0) return;

  sections.push("\nEducation:");
  for (const [index, entry] of entries.entries()) {
    sections.push(
      `${index + 1}. ${entry.degree || "Degree"} - ${entry.institution || "Institution"}`,
    );
    if (entry.year) sections.push(`   Year: ${entry.year}`);
  }
};

const appendSkillsSection = (sections: string[], skills?: Record<string, unknown> | null) => {
  if (!skills) return;
  sections.push("\nSkills:");
  sections.push(JSON.stringify(skills, null, 2));
};

const appendProjectsSection = (sections: string[], entries: ProjectEntry[]) => {
  if (entries.length === 0) return;

  sections.push("\nProjects:");
  for (const [index, project] of entries.entries()) {
    sections.push(`\n${index + 1}. ${project.name || project.title || "Project"}`);
    if (project.description) sections.push(`   ${project.description}`);
    if (project.technologies && project.technologies.length > 0) {
      sections.push(`   Technologies: ${project.technologies.join(", ")}`);
    }
  }
};

const appendGamingExperienceSection = (
  sections: string[],
  gamingExperience?: Record<string, unknown> | null,
) => {
  if (!gamingExperience) return;
  sections.push("\nGaming Experience:");
  sections.push(JSON.stringify(gamingExperience, null, 2));
};

/**
 * Serialize resume data to text for AI analysis
 */
function serializeResume(resume: ResumeRecord): string {
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

const createFallbackJobMatch = (job: JobRow) => ({
  jobId: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  remote: job.remote ?? false,
  score: DEFAULT_SCORE_NEUTRAL,
  strengths: [],
  concerns: [],
  highlightSkills: [],
});

const buildResumeJobDescription = (job: JobRow): string => {
  return `
Title: ${job.title}
Company: ${job.company}
Description: ${job.description || ""}
Requirements: ${job.requirements?.join(", ") || ""}
Technologies: ${job.technologies?.join(", ") || ""}
  `.trim();
};

const parseResumeAnalysisResult = (content: string): ResumeAnalysisResult => {
  const parsed = safeJSONParse(content, DEFAULT_ANALYZE_RESUME_RESPONSE);
  return {
    score: parsed.score || DEFAULT_ANALYZE_RESUME_RESPONSE.score,
    strengths: parsed.strengths || [],
    improvements: parsed.improvements || [],
    keywords: parsed.keywords || [],
  };
};

const parseCoverLetterSections = (content: string): CoverLetterSections => {
  const parsed = safeJSONParse(content, DEFAULT_COVER_LETTER_RESPONSE);
  return {
    introduction: parsed.introduction || DEFAULT_COVER_LETTER_RESPONSE.introduction,
    body: parsed.body || "My experience and skills make me a strong candidate.",
    conclusion: parsed.conclusion || "I look forward to discussing this opportunity.",
  };
};

const persistChatMessage = async (
  message: ChatHistoryInsert,
): Promise<PromiseSettledResult<unknown>> => {
  return settle(db.insert(chatHistory).values(message));
};

const buildAnalyzeResumePrompt = (resumeText: string, jobDescription: string): string => {
  if (jobDescription.length > 0) {
    return `${resumeScorePrompt(resumeText, jobDescription)}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), improvements (string[]), keywords (string[]).`;
  }
  return `${resumeEnhancePrompt(resumeText)}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), improvements (string[]), keywords (string[]).`;
};

const resolveAnalyzeResumeJobDescription = async (jobId?: string): Promise<string> => {
  if (!jobId) return "";
  const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
  return jobRows.length > 0 ? buildResumeJobDescription(jobRows[0]) : "";
};

const resolveCoverLetterJobDescription = async (jobId?: string): Promise<string> => {
  if (!jobId) return JOB_DESCRIPTION_UNAVAILABLE;
  const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (jobRows.length === 0) return JOB_DESCRIPTION_UNAVAILABLE;
  return jobRows[0].description || JOB_DESCRIPTION_UNAVAILABLE;
};

const extractResumeSkills = (resume: ResumeRecord): string[] =>
  resume.skills ? Object.values(resume.skills).flatMap((value) => collectStringArray(value)) : [];

const mergeUniqueSkills = (existing: string[], additional: string[]): string[] => {
  if (additional.length === 0) return existing;
  return [...new Set([...existing, ...additional])];
};

const buildMatchProfile = async (
  skills: string[] | undefined,
  resumeId?: string,
): Promise<MatchProfile> => {
  const profileRows = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
  const profile = profileRows[0];

  let userSkills = skills || [];
  let experience = "";
  let goals = "";

  if (profile) {
    userSkills = skills || [...(profile.technicalSkills || []), ...(profile.softSkills || [])];
    experience = profile.summary || "";
    goals = profile.careerGoals ? JSON.stringify(profile.careerGoals) : "";
  }

  if (!resumeId) return { userSkills, experience, goals };

  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));
  const resume = resumeRows[0];
  if (!resume) return { userSkills, experience, goals };

  if (resume.summary) experience = resume.summary;
  userSkills = mergeUniqueSkills(userSkills, extractResumeSkills(resume));
  return { userSkills, experience, goals };
};

const buildJobMatchPromptText = (profile: MatchProfile, job: JobRow): string =>
  `${jobMatchPrompt(
    {
      skills: profile.userSkills,
      experience: profile.experience,
      goals: profile.goals,
    },
    {
      title: job.title,
      company: job.company,
      description: job.description || "",
      requirements: job.requirements || [],
    },
  )}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), concerns (string[]), highlightSkills (string[]).`;

const analyzeSingleJobMatch = async (
  aiService: AIService,
  profile: MatchProfile,
  job: JobRow,
): Promise<MatchJobsResponse["matches"][number]> => {
  const responseResult = await settle(
    aiService.generate(buildJobMatchPromptText(profile, job), {
      purpose: "jobMatch",
      temperature: AI_DEFAULT_TEMPERATURE,
      maxTokens: AI_MAX_TOKENS_CHAT,
    }),
  );
  if (responseResult.status === "rejected") {
    aiRoutesLogger.error(`Failed to analyze job ${job.id}:`, responseResult.reason);
    return createFallbackJobMatch(job);
  }

  const response = responseResult.value;
  if (response.error) return createFallbackJobMatch(job);

  const parsed = safeJSONParse(response.content, {
    score: DEFAULT_SCORE_NEUTRAL,
    strengths: [],
    concerns: [],
    highlightSkills: [],
  });

  return {
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote ?? false,
    score: parsed.score || DEFAULT_SCORE_NEUTRAL,
    strengths: parsed.strengths || [],
    concerns: parsed.concerns || [],
    highlightSkills: parsed.highlightSkills || [],
  };
};

const buildJobMatchRecommendations = (matches: MatchJobsResponse["matches"]): string[] => {
  const topMatch = matches[0];
  if (!topMatch) return [];
  return [
    `Apply to ${topMatch.title} at ${topMatch.company} (${topMatch.score}% match)`,
    ...topMatch.strengths.slice(0, 2),
  ];
};

const runJobMatchingFlow = async (
  resumeId: string | undefined,
  skills: string[] | undefined,
): Promise<MatchJobsResponse> => {
  const profile = await buildMatchProfile(skills, resumeId);
  const recentJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.postedDate))
    .limit(AI_CHAT_RECENT_JOBS_LIMIT);
  if (recentJobs.length === 0) {
    return {
      message: API_MESSAGE_AI_NO_JOBS_FOR_MATCHING,
      matches: [],
      recommendations: [],
    };
  }

  const aiService = await getAIService();
  const matches = await Promise.all(
    recentJobs.slice(0, 5).map((job) => analyzeSingleJobMatch(aiService, profile, job)),
  );
  matches.sort((a, b) => b.score - a.score);

  return {
    message: API_MESSAGE_JOB_MATCHING_COMPLETE,
    matches,
    recommendations: buildJobMatchRecommendations(matches),
  };
};

const startJobApplyRun = (
  runId: string,
  payload: {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
  },
) => {
  applicationAutomationService.runJobApply(runId, payload).then(undefined, (error) => {
    aiRoutesLogger.error("Failed to execute job application automation run:", error);
  });
};

const buildChatRouteResponse = (
  assistantMessage: ChatHistoryInsert,
  response: Awaited<ReturnType<AIService["generate"]>>,
  preferredDomain: AIChatContextDomain,
) => ({
  message: assistantMessage.content,
  sessionId: assistantMessage.sessionId,
  timestamp: assistantMessage.timestamp,
  provider: response.provider,
  model: response.model,
  followUps: contextManager.generateFollowUps(preferredDomain),
  contextDomain: preferredDomain,
});

const handleChatRoute = async (
  body: { message: string; sessionId?: string; context?: ChatContextPayload },
  set: RouteSetState,
) => {
  const sessionId = body.sessionId ?? generateId();
  const persistUserMessageResult = await persistChatMessage(
    createChatMessage("user", body.message, sessionId),
  );
  if (persistUserMessageResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: toErrorMessage(persistUserMessageResult.reason, API_ERROR_GENERATE_AI_RESPONSE),
    };
  }

  const clientContext = normalizeClientChatContext(body.context);
  const preferredDomain = clientContext?.domain ?? contextManager.inferDomain(body.message);
  const settingsRow = await getAISettingsRow();
  const runtimeBrand = resolveBrandSettings(settingsRow?.brandSettings);
  const aiService = await getAIService(settingsRow);
  const contextualConversation = await contextManager.buildContext(
    sessionId,
    body.message,
    preferredDomain,
    runtimeBrand,
  );
  const systemPrompt = composeChatSystemPrompt(
    buildSystemPrompt(runtimeBrand),
    contextualConversation.systemPrompt,
    clientContext,
  );
  const generationResult = await settle(
    aiService.generate(body.message, {
      purpose: "chat",
      systemPrompt,
      messages: contextualConversation.messages,
      temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (generationResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(generationResult.reason, API_ERROR_GENERATE_AI_RESPONSE) };
  }

  const response = generationResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: response.error };
  }

  const assistantMessage = createChatMessage("assistant", response.content, sessionId);
  const persistAssistantMessageResult = await persistChatMessage(assistantMessage);
  if (persistAssistantMessageResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: toErrorMessage(persistAssistantMessageResult.reason, API_ERROR_GENERATE_AI_RESPONSE),
    };
  }
  return buildChatRouteResponse(assistantMessage, response, preferredDomain);
};

const handleAnalyzeResumeRoute = async (body: AnalyzeResumeBody, set: RouteSetState) => {
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, body.resumeId));
  if (resumeRows.length === 0) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_RESUME_NOT_FOUND };
  }

  const resumeText = serializeResume(resumeRows[0] as ResumeRecord);
  const jobDescription = await resolveAnalyzeResumeJobDescription(body.jobId);
  const aiService = await getAIService();
  const responseResult = await settle(
    aiService.generate(buildAnalyzeResumePrompt(resumeText, jobDescription), {
      purpose: "resume",
      temperature: AI_DEFAULT_TEMPERATURE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (responseResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(responseResult.reason, API_ERROR_ANALYZE_RESUME) };
  }

  const response = responseResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: response.error };
  }

  return {
    message: API_MESSAGE_RESUME_ANALYSIS_COMPLETE,
    resumeId: body.resumeId,
    jobId: body.jobId || null,
    analysis: parseResumeAnalysisResult(response.content),
    provider: response.provider,
    model: response.model,
  };
};

const handleGenerateCoverLetterRoute = async (
  body: GenerateCoverLetterBody,
  set: RouteSetState,
) => {
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, body.resumeId));
  if (resumeRows.length === 0) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_RESUME_NOT_FOUND };
  }

  const resumeText = serializeResume(resumeRows[0] as ResumeRecord);
  const jobDescription = await resolveCoverLetterJobDescription(body.jobId);
  const aiService = await getAIService();
  const responseResult = await settle(
    aiService.generate(coverLetterPrompt(body.company, body.position, jobDescription, resumeText), {
      purpose: "coverLetter",
      temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (responseResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(responseResult.reason, API_ERROR_GENERATE_COVER_LETTER) };
  }

  const response = responseResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: response.error };
  }

  return {
    message: API_MESSAGE_COVER_LETTER_GENERATED,
    content: parseCoverLetterSections(response.content),
    provider: response.provider,
    model: response.model,
  };
};

const handleMatchJobsRoute = async (body: MatchJobsBody, set: RouteSetState) => {
  const flowResult = await settle(runJobMatchingFlow(body.resumeId, body.skills));
  if (flowResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(flowResult.reason, API_ERROR_MATCH_JOBS) };
  }
  return flowResult.value;
};

/**
 * AI route group for chat, content generation, matching, and automation triggers.
 */
export const aiRoutes = new Elysia({ prefix: "/ai", tags: ["AI"] })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: MS_PER_MINUTE,
      max: 25,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .post("/chat", async ({ body, set }) => handleChatRoute(body, set), {
    body: t.Object({
      message: t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
      sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      context: t.Optional(chatContextSchema),
    }),
  })
  .post("/analyze-resume", async ({ body, set }) => handleAnalyzeResumeRoute(body, set), {
    body: t.Object({
      resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    }),
  })
  .post(
    "/generate-cover-letter",
    async ({ body, set }) => handleGenerateCoverLetterRoute(body, set),
    {
      body: t.Object({
        resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
        jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
        company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
      }),
    },
  )
  .post("/match-jobs", async ({ body, set }) => handleMatchJobsRoute(body, set), {
    body: t.Object({
      resumeId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      skills: t.Optional(
        t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
          maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
        }),
      ),
      preferences: t.Optional(aiPreferenceSchema),
    }),
  })
  .get("/models", async () => buildProviderModelsResponse())
  .get("/usage", async () => {
    const chatMessages = await db.select().from(chatHistory);

    return {
      totalMessages: chatMessages.length,
      userMessages: chatMessages.filter((m) => m.role === "user").length,
      assistantMessages: chatMessages.filter((m) => m.role === "assistant").length,
      sessions: [...new Set(chatMessages.map((m) => m.sessionId))].length,
      recentActivity: chatMessages.slice(-AI_CHAT_CONTEXT_TAIL_LIMIT).map((m) => ({
        timestamp: m.timestamp,
        role: m.role,
        sessionId: m.sessionId,
      })),
    };
  })
  .post(
    "/automation-action",
    async ({ body, set }) => {
      const { action, jobUrl, resumeId, coverLetterId, jobId } = body;

      if (action !== "job_apply") {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return { error: API_ERROR_UNSUPPORTED_AUTOMATION_ACTION.replace("__ACTION__", action) };
      }

      const runResult = await settle(
        applicationAutomationService.createJobApplyRun(
          { jobUrl, resumeId, coverLetterId, jobId },
          { includeActionInPayload: true },
        ),
      );
      if (runResult.status === "rejected") {
        const mapped = mapAutomationRouteError(runResult.reason);
        set.status = mapped.status;
        return {
          error: mapped.body.error.message,
        };
      }

      const runId = runResult.value;
      startJobApplyRun(runId, {
        jobUrl,
        resumeId,
        coverLetterId,
        jobId,
      });

      return {
        runId,
        status: "running",
        message:
          "Job application automation started. Use GET /api/automation/runs/:id to check status.",
      };
    },
    {
      body: t.Object({
        action: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
        jobUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
        resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
        coverLetterId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
        jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      }),
    },
  );
