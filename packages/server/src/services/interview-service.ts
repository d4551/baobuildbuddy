import {
  AI_DEFAULT_TEMPERATURE_INTERVIEW,
  AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS,
  AI_MAX_TOKENS_ANALYSIS,
  AI_MAX_TOKENS_FEEDBACK,
  AI_MAX_TOKENS_QUESTION,
  AI_OPERATION_TIMEOUT_MS,
  API_ERROR_AI_NO_QUESTIONS,
  API_ERROR_AI_OPERATION_TIMEOUT,
  DECIMAL_RADIX,
  DEFAULT_UNSPECIFIED_LABEL,
  generateId,
  INTERVIEW_DEFAULT_DURATION_MINUTES,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_FOCUS_AREAS,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_CATEGORY,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
  type InterviewCandidateContext,
  type InterviewConversationStyle,
  INTERVIEW_FALLBACK_STUDIO_ID,
  INTERVIEW_SERVICE_MAX_QUESTION_COUNT,
  type InterviewAnalysis,
  type InterviewConfig,
  type InterviewerPersona,
  type InterviewMode,
  type InterviewQuestion,
  type InterviewResponse,
  type InterviewSession,
  type InterviewTargetJob,
  normalizeScrapePersonaEnrichment,
  type ScrapePersonaEnrichment,
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
  safeParseJson,
  settle,
  toErrorMessage,
  type VoiceSettings,
} from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { interviewSessions } from "../db/schema/interviews";
import { portfolioProjects, portfolios } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { studios } from "../db/schema/studios";
import { userProfile } from "../db/schema/user";
import { createServerLogger } from "../utils/logger";
import { AIService } from "./ai/ai-service";
import {
  interviewFeedbackPrompt,
  interviewPersonaPrompt,
  interviewQuestionPrompt,
} from "./ai/prompts";

type DBInterviewSession = typeof interviewSessions.$inferSelect;
type InterviewConfigInput = Record<string, unknown>;
type JsonRecord = Record<string, unknown>;

interface StudioContext {
  id: string;
  name: string;
  description: string;
  interviewStyle: string;
  technologies: string[];
  games: string[];
  culture: Record<string, unknown>;
  location: string;
  type: string;
  remoteWork: boolean;
  enrichment?: ScrapePersonaEnrichment;
}

interface CandidateInterviewContext {
  conversationStyle: InterviewConversationStyle;
  profileSummary: string;
  resumeSummary: string;
  coverLetterSummary: string;
  portfolioSummary: string;
}

interface FinalAnalysisPromptContext {
  studio: StudioContext;
  config: InterviewConfig;
  responses: InterviewResponse[];
  persona: InterviewerPersona;
  candidateContext: CandidateInterviewContext;
}

const toPersistedRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};
const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;

const DEFAULT_INTERVIEW_MODE: InterviewMode = "studio";
const DEFAULT_INTERVIEW_CONVERSATION_STYLE: InterviewConversationStyle = "natural";
const JSON_CODE_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/i;
const JSON_ARRAY_PATTERN = /\[[\s\S]*\]/;
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;
const SUMMARY_HIGHLIGHT_SPLIT_PATTERN = /[;,]/u;
const interviewServiceLogger = createServerLogger("interview-service");
const FALLBACK_INTERVIEW_QUESTIONS: Array<Omit<InterviewQuestion, "id">> = [
  {
    type: "intro",
    difficulty: "easy",
    question:
      "Tell me about a game feature or system you shipped recently and the tradeoffs you made.",
    followUps: [
      "What constraints shaped your implementation?",
      "What would you do differently now?",
      "How did you validate it with stakeholders?",
    ],
    expectedDuration: 120,
    tags: ["systems", "delivery"],
  },
  {
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a time you disagreed on technical direction with a teammate.",
    followUps: [
      "How did you resolve the disagreement?",
      "What evidence helped persuade the team?",
      "What did you learn?",
    ],
    expectedDuration: 120,
    tags: ["collaboration", "communication"],
  },
  {
    type: "studio-specific",
    difficulty: "medium",
    question: "What would you do in your first 30 days at this studio?",
    followUps: [
      "Which teams would you partner with first?",
      "How would you reduce context-switching?",
      "What deliverable would you own first?",
    ],
    expectedDuration: 150,
    tags: ["ownership", "planning"],
  },
  {
    type: "technical",
    difficulty: "medium",
    question: "How do you approach debugging intermittent gameplay or networking issues?",
    followUps: [
      "What instrumentation do you rely on first?",
      "How do you isolate repro steps?",
      "How do you confirm the fix is stable?",
    ],
    expectedDuration: 180,
    tags: ["debugging", "quality"],
  },
  {
    type: "technical",
    difficulty: "hard",
    question:
      "Design a robust retry strategy for an unstable API used during runtime content updates.",
    followUps: [
      "How do you avoid thundering-herd failures?",
      "What metrics indicate your strategy is healthy?",
      "How do you communicate outage risk to PMs?",
    ],
    expectedDuration: 180,
    tags: ["architecture", "resilience"],
  },
  {
    type: "closing",
    difficulty: "easy",
    question: "Why should this studio choose you for this role right now?",
    followUps: [
      "Which accomplishment best proves that?",
      "How do you grow with new team members?",
      "What would you ship in your first sprint?",
    ],
    expectedDuration: 120,
    tags: ["fit", "ownership"],
  },
];

async function withAiOperationTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = AI_OPERATION_TIMEOUT_MS,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`AI operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ])
    .then(
      (value) => value,
      () => null,
    )
    .finally(() => {
      if (timer) clearTimeout(timer);
    });
}

function extractSummaryValue(summary: string, label: string): string {
  const matcher = new RegExp(`^- ${label}:\\s*(.+)$`, "im");
  return summary.match(matcher)?.[1]?.trim() ?? "";
}

function extractSummaryHighlights(summary: string, label: string, maxItems = 3): string[] {
  return extractSummaryValue(summary, label)
    .split(SUMMARY_HIGHLIGHT_SPLIT_PATTERN)
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value !== DEFAULT_UNSPECIFIED_LABEL)
    .slice(0, maxItems);
}

type FallbackInterviewContext = {
  interviewEntity: string;
  roleTarget: string;
  primaryTechnology: string;
  experienceHighlight: string;
  projectHighlight: string;
  focusArea: string;
  hiringSignal: string;
  pitchAngle: string;
};

function buildFallbackInterviewContext(
  studio: StudioContext,
  config: InterviewConfig,
  candidateContext: CandidateInterviewContext,
): FallbackInterviewContext {
  const targetJob = config.targetJob;
  const interviewEntity =
    config.interviewMode === "job" && targetJob?.company ? targetJob.company : studio.name;
  const roleTarget = targetJob?.title || config.roleType;
  const technicalHighlights =
    targetJob?.technologies?.filter((value) => value.trim().length > 0) ??
    extractSummaryHighlights(candidateContext.resumeSummary, "Technical skills");

  return {
    interviewEntity,
    roleTarget,
    primaryTechnology:
      technicalHighlights.find((value) => value.length > 0) ?? "your strongest technical stack",
    experienceHighlight:
      extractSummaryHighlights(candidateContext.resumeSummary, "Experience highlights", 1)[0] ??
      extractSummaryHighlights(candidateContext.profileSummary, "Current role", 1)[0] ??
      "recent game-industry delivery work",
    projectHighlight:
      extractSummaryHighlights(candidateContext.resumeSummary, "Project highlights", 1)[0] ??
      extractSummaryHighlights(candidateContext.portfolioSummary, "Featured work", 1)[0] ??
      "a player-facing system you shipped",
    focusArea:
      targetJob?.enrichment?.interviewFocusAreas?.[0] ??
      studio.enrichment?.interviewFocusAreas?.[0] ??
      "cross-functional delivery",
    hiringSignal:
      targetJob?.enrichment?.hiringSignals?.[0] ??
      studio.enrichment?.hiringSignals?.[0] ??
      "shipping velocity and collaborative execution",
    pitchAngle:
      targetJob?.enrichment?.candidatePitchAngles?.[0] ??
      studio.enrichment?.candidatePitchAngles?.[0] ??
      "measurable player impact and ownership",
  };
}

function buildFallbackIntroQuestion(context: FallbackInterviewContext) {
  return {
    question: `Your background highlights ${context.experienceHighlight}. How does that prepare you for the ${context.roleTarget} role at ${context.interviewEntity}?`,
    followUps: [
      `Which result from ${context.projectHighlight} is most relevant to ${context.interviewEntity}?`,
      "How did you validate the outcome with teammates, stakeholders, or players?",
      "What tradeoff from that work would you handle differently now?",
    ],
    tags: ["candidate-context", "role-context"],
  };
}

function buildFallbackBehavioralQuestion(context: FallbackInterviewContext) {
  return {
    question: `Tell me about a time you aligned design, QA, or production partners to deliver ${context.focusArea} work with a clear outcome.`,
    followUps: [
      "What disagreement or constraint made the collaboration difficult?",
      "How did you keep the team aligned when priorities shifted?",
      "What evidence told you the collaboration was successful?",
    ],
    tags: ["candidate-context", "collaboration"],
  };
}

function buildFallbackStudioSpecificQuestion(context: FallbackInterviewContext) {
  return {
    question: `${context.interviewEntity} is signaling ${context.hiringSignal}. How would you ramp up in your first 30 days and show that ${context.pitchAngle}?`,
    followUps: [
      `Which stakeholder would you meet first to support ${context.focusArea}?`,
      "What deliverable would you aim to own by the end of your first sprint?",
      "How would you tailor your communication to this studio context?",
    ],
    tags: ["studio-context", "scrape-enrichment"],
  };
}

function buildFallbackTechnicalQuestion(context: FallbackInterviewContext) {
  return {
    question: `Walk me through a system from ${context.projectHighlight} where you used ${context.primaryTechnology} in a way that would transfer directly to the ${context.roleTarget} scope at ${context.interviewEntity}.`,
    followUps: [
      `What constraints shaped your use of ${context.primaryTechnology}?`,
      "What telemetry, QA checks, or player signals told you the solution was healthy?",
      "How would you scale that approach for a larger team or live-service environment?",
    ],
    tags: ["candidate-context", "technical-context"],
  };
}

function buildFallbackClosingQuestion(context: FallbackInterviewContext) {
  return {
    question: `What is the strongest evidence from your resume, cover letter, or portfolio that you are ready for ${context.roleTarget} at ${context.interviewEntity} right now?`,
    followUps: [
      "Which accomplishment best proves that claim?",
      "How does that evidence connect to this studio's priorities?",
      "What would you aim to deliver in your first 30 days?",
    ],
    tags: ["candidate-context", "closing"],
  };
}

function buildFallbackQuestionText(
  seed: Omit<InterviewQuestion, "id">,
  studio: StudioContext,
  config: InterviewConfig,
  candidateContext: CandidateInterviewContext,
): { question: string; followUps: string[]; tags: string[] } {
  const context = buildFallbackInterviewContext(studio, config, candidateContext);

  switch (seed.type) {
    case "intro":
      return { ...buildFallbackIntroQuestion(context), tags: [...seed.tags, "candidate-context", "role-context"] };
    case "behavioral":
      return { ...buildFallbackBehavioralQuestion(context), tags: [...seed.tags, "candidate-context", "collaboration"] };
    case "studio-specific":
      return { ...buildFallbackStudioSpecificQuestion(context), tags: [...seed.tags, "studio-context", "scrape-enrichment"] };
    case "technical":
      return { ...buildFallbackTechnicalQuestion(context), tags: [...seed.tags, "candidate-context", "technical-context"] };
    case "closing":
      return { ...buildFallbackClosingQuestion(context), tags: [...seed.tags, "candidate-context", "closing"] };
  }
}

function buildFallbackQuestions(
  config: InterviewConfig,
  studio: StudioContext,
  candidateContext: CandidateInterviewContext,
): InterviewQuestion[] {
  const includeTechnical = Boolean(config.includeTechnical);
  const includeBehavioral = Boolean(config.includeBehavioral);
  const includeStudioSpecific = Boolean(config.includeStudioSpecific);

  const filtered = FALLBACK_INTERVIEW_QUESTIONS.filter((question) => {
    if (question.type === "technical") return includeTechnical;
    if (question.type === "behavioral") return includeBehavioral;
    if (question.type === "studio-specific") return includeStudioSpecific;
    return true;
  });

  const normalizedQuestionCount = Math.max(1, config.questionCount);
  const pool = filtered.length > 0 ? filtered : FALLBACK_INTERVIEW_QUESTIONS;
  const questions: InterviewQuestion[] = [];

  while (questions.length < normalizedQuestionCount) {
    const seed = pool[questions.length % pool.length];
    const contextualized = buildFallbackQuestionText(seed, studio, config, candidateContext);
    questions.push({
      ...seed,
      id: `fallback-${questions.length + 1}`,
      question: contextualized.question,
      followUps: contextualized.followUps,
      tags: contextualized.tags,
    });
  }

  return questions.slice(0, normalizedQuestionCount);
}

const questionTypePattern = new Set<string>([
  "behavioral",
  "technical",
  "studio-specific",
  "intro",
  "closing",
]);

const difficultyPattern = new Set<string>(["easy", "medium", "hard"]);
/**
 * Parse unknown value as integer within range.
 */
function parseNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(Math.floor(value), max));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, DECIMAL_RADIX);
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(parsed, max));
    }
  }

  return fallback;
}

/**
 * Parse a boolean-like value.
 */
function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

/**
 * Parse string with fallback.
 */
function parseString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Parse array of tags/strings.
 */
function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const strings = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
  return strings.map((entry) => entry.trim());
}

function normalizeInterviewMode(value: unknown): InterviewMode {
  return value === "job" ? "job" : DEFAULT_INTERVIEW_MODE;
}

function normalizeConversationStyle(value: unknown): InterviewConversationStyle {
  return value === "structured" ? "structured" : DEFAULT_INTERVIEW_CONVERSATION_STYLE;
}

function normalizeCandidateContext(value: unknown): InterviewCandidateContext | undefined {
  if (!isRecord(value)) return;

  const resumeId = parseString(value.resumeId, "");
  const coverLetterId = parseString(value.coverLetterId, "");
  const portfolioId = parseString(value.portfolioId, "");
  if (!(resumeId || coverLetterId || portfolioId)) {
    return;
  }

  return {
    ...(resumeId ? { resumeId } : {}),
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(portfolioId ? { portfolioId } : {}),
  };
}

function normalizeInterviewTargetJob(value: unknown): InterviewTargetJob | undefined {
  if (!isRecord(value)) return;

  const id = parseString(value.id, "");
  const title = parseString(value.title, "");
  const company = parseString(value.company, "");
  const location = parseString(value.location, "");

  if (!(id && title && company && location)) {
    return;
  }

  const requirements = parseStringArray(value.requirements);
  const technologies = parseStringArray(value.technologies);
  const description = parseString(value.description, "");
  const source = parseString(value.source, "");
  const postedDate = parseString(value.postedDate, "");
  const url = parseString(value.url, "");
  const enrichment = normalizeScrapePersonaEnrichment(value.enrichment);

  const targetJob: InterviewTargetJob = {
    id,
    title,
    company,
    location,
  };
  if (description) {
    targetJob.description = description;
  }
  if (requirements.length > 0) {
    targetJob.requirements = requirements;
  }
  if (technologies.length > 0) {
    targetJob.technologies = technologies;
  }
  if (source) {
    targetJob.source = source;
  }
  if (postedDate) {
    targetJob.postedDate = postedDate;
  }
  if (url) {
    targetJob.url = url;
  }
  if (enrichment) {
    targetJob.enrichment = enrichment;
  }

  return targetJob;
}

function normalizeVoiceSettings(raw: unknown): VoiceSettings | undefined {
  if (!isRecord(raw)) return;

  const microphoneId = parseString(raw.microphoneId, "");
  const speakerId = parseString(raw.speakerId, "");
  const voiceId = parseString(raw.voiceId, "");
  const voiceSettings: VoiceSettings = {
    rate: parseNumber(raw.rate, INTERVIEW_DEFAULT_VOICE_SETTINGS.rate, 0.25, 3),
    pitch: parseNumber(raw.pitch, INTERVIEW_DEFAULT_VOICE_SETTINGS.pitch, 0.5, 2),
    volume: parseNumber(raw.volume, INTERVIEW_DEFAULT_VOICE_SETTINGS.volume, 0, 2),
    language: parseString(raw.language, INTERVIEW_DEFAULT_VOICE_SETTINGS.language),
  };
  if (microphoneId) {
    voiceSettings.microphoneId = microphoneId;
  }
  if (speakerId) {
    voiceSettings.speakerId = speakerId;
  }
  if (voiceId) {
    voiceSettings.voiceId = voiceId;
  }
  return voiceSettings;
}

/**
 * Normalize interview configuration from previous and current callers.
 */
function normalizeConfig(raw: InterviewConfigInput): InterviewConfig {
  const questionCount = parseNumber(
    raw.questionCount,
    INTERVIEW_DEFAULT_QUESTION_COUNT,
    1,
    INTERVIEW_SERVICE_MAX_QUESTION_COUNT,
  );
  const duration = parseNumber(raw.duration, INTERVIEW_DEFAULT_DURATION_MINUTES, 5, 120);
  const experienceLevel = normalizeExperienceLevel(
    parseString(raw.experienceLevel, INTERVIEW_DEFAULT_EXPERIENCE_LEVEL),
  );
  const interviewMode = normalizeInterviewMode(raw.interviewMode);
  const targetJob = normalizeInterviewTargetJob(raw.targetJob);
  const roleType = parseString(raw.roleType, targetJob?.title || INTERVIEW_DEFAULT_ROLE_TYPE);
  const roleCategory = parseString(raw.roleCategory, INTERVIEW_DEFAULT_ROLE_CATEGORY);
  const includeTechnical = parseBoolean(raw.includeTechnical, true);
  const includeBehavioral = parseBoolean(raw.includeBehavioral, true);
  const includeStudioSpecific = parseBoolean(raw.includeStudioSpecific, true);
  const focusAreas = parseStringArray(raw.focusAreas);
  const technologies = parseStringArray(raw.technologies);
  const enableVoiceMode = parseBoolean(raw.enableVoiceMode, false);
  const voiceSettings = normalizeVoiceSettings(raw.voiceSettings);
  const candidateContext = normalizeCandidateContext(raw.candidateContext);
  const conversationStyle = normalizeConversationStyle(raw.conversationStyle);

  return {
    roleType,
    roleCategory,
    experienceLevel,
    focusAreas: focusAreas.length > 0 ? focusAreas : [...INTERVIEW_DEFAULT_FOCUS_AREAS],
    duration,
    questionCount,
    includeTechnical,
    includeBehavioral,
    includeStudioSpecific,
    enableVoiceMode,
    technologies,
    voiceSettings,
    interviewMode,
    conversationStyle,
    targetJob,
    candidateContext,
  };
}

/**
 * Normalize interview level values to consistent format.
 */
function normalizeExperienceLevel(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("lead")) return "lead";
  if (normalized.includes("senior")) return "senior";
  if (normalized.includes("entry") || normalized.includes("junior")) return "entry";
  if (normalized.includes("mid")) return "mid";
  return INTERVIEW_DEFAULT_EXPERIENCE_LEVEL;
}

/**
 * Restore known interview type values from unknown payload.
 */
function normalizeQuestionType(
  value: unknown,
  fallback: InterviewQuestion["type"],
): InterviewQuestion["type"] {
  if (typeof value !== "string" || !questionTypePattern.has(value)) {
    return fallback;
  }

  if (
    value === "behavioral" ||
    value === "technical" ||
    value === "studio-specific" ||
    value === "intro" ||
    value === "closing"
  ) {
    return value;
  }

  return fallback;
}

/**
 * Restore known interview difficulty values from unknown payload.
 */
function normalizeDifficulty(value: unknown): InterviewQuestion["difficulty"] {
  if (typeof value !== "string" || !difficultyPattern.has(value)) {
    return "medium";
  }
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  return "medium";
}

function normalizeQuestions(raw: unknown): InterviewQuestion[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((value, index): InterviewQuestion | null => {
      if (!isRecord(value)) return null;

      const rawId = value.id;
      const id =
        typeof rawId === "string"
          ? rawId.trim() || `generated-${index + 1}`
          : `generated-${Number(rawId) || index + 1}`;
      const followUps = Array.isArray(value.followUps) ? value.followUps : [];
      if (typeof value.question !== "string" || !value.question.trim()) {
        return null;
      }

      return {
        id,
        type: normalizeQuestionType(value.type, "behavioral"),
        question: value.question.trim(),
        followUps: parseStringArray(followUps),
        expectedDuration: parseNumber(value.expectedDuration, 90, 30, 300),
        difficulty: normalizeDifficulty(value.difficulty),
        tags: parseStringArray(value.tags),
      };
    })
    .filter((entry): entry is InterviewQuestion => entry !== null);
}

function normalizeResponses(raw: unknown): InterviewResponse[] {
  if (!Array.isArray(raw)) return [];

  const parsed: InterviewResponse[] = [];

  for (const value of raw) {
    if (!isRecord(value)) continue;

    if (
      typeof value.questionId !== "string" ||
      typeof value.transcript !== "string" ||
      typeof value.duration !== "number" ||
      typeof value.timestamp !== "number" ||
      typeof value.confidence !== "number"
    ) {
      continue;
    }

    const aiAnalysis = isRecord(value.aiAnalysis) ? value.aiAnalysis : null;

    parsed.push({
      questionId: value.questionId,
      transcript: value.transcript,
      duration: value.duration,
      timestamp: value.timestamp,
      confidence: value.confidence,
      ...(aiAnalysis
        ? {
            aiAnalysis: {
              score: normalizeAiAnalysisScore(aiAnalysis.score),
              feedback: typeof aiAnalysis.feedback === "string" ? aiAnalysis.feedback : "",
              strengths: parseStringArray(aiAnalysis.strengths),
              improvements: parseStringArray(aiAnalysis.improvements),
            },
          }
        : {}),
    });
  }

  return parsed;
}

function normalizeAiAnalysisScore(scoreCandidate: unknown): number {
  if (typeof scoreCandidate === "number" && Number.isFinite(scoreCandidate)) {
    return normalizeScore(Math.round(scoreCandidate));
  }
  return 0;
}

function normalizeFinalAnalysis(raw: unknown): InterviewAnalysis | null {
  if (!isRecord(raw)) return null;

  if (typeof raw.overallScore !== "number") {
    return null;
  }

  const feedback = typeof raw.feedback === "string" ? raw.feedback : "";

  return {
    overallScore: normalizeScore(raw.overallScore),
    strengths: parseStringArray(raw.strengths),
    improvements: parseStringArray(raw.improvements),
    recommendations: parseStringArray(raw.recommendations),
    ...(feedback ? { feedback } : {}),
  };
}

function normalizeInterviewSessionStatus(value: unknown): InterviewSession["status"] {
  if (
    value === "preparing" ||
    value === "active" ||
    value === "paused" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "active";
}

function extractJSON(text: string): string {
  if (typeof text !== "string") return text;

  const codeFenceMatch = text.match(JSON_CODE_FENCE_PATTERN);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1].trim();
  }

  const arrayMatch = text.match(JSON_ARRAY_PATTERN);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  const objectMatch = text.match(JSON_OBJECT_PATTERN);
  if (objectMatch) {
    return objectMatch[0];
  }

  return text.trim();
}

/**
 * Parse JSON safely and return null when parsing fails.
 */
function safeParseJSON(payload: unknown): unknown {
  if (typeof payload !== "string") return null;
  const extracted = extractJSON(payload);
  return safeParseJson(extracted);
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fallbackResponseScore(transcript: string): number {
  const normalizedTranscript = transcript.trim().toLowerCase();
  const base = Math.min(90, 20 + Math.floor(normalizedTranscript.length / 7));
  if (normalizedTranscript.length < 80) return Math.max(35, base - 25);
  if (normalizedTranscript.includes("example") || normalizedTranscript.includes("result"))
    return base + 12;
  if (normalizedTranscript.includes("metric") || normalizedTranscript.includes("kpi"))
    return base + 8;
  return base;
}

function fallbackResponseFeedback(
  transcript: string,
): NonNullable<InterviewResponse["aiAnalysis"]> {
  return {
    score: fallbackResponseScore(transcript),
    feedback:
      transcript.length >= 140
        ? "Response shows useful depth and relevant structure."
        : "Add measurable outcomes and a clearer step-by-step breakdown.",
    strengths: ["Clear attempt to answer the asked question.", "Shows structured thinking."].filter(
      Boolean,
    ),
    improvements:
      transcript.length < 140
        ? ["Add specific examples and impact metrics."]
        : ["Keep responses concise and concrete."],
  };
}

function buildInterviewerPersona(
  studio: StudioContext,
  config: InterviewConfig,
): InterviewerPersona {
  const level = config.experienceLevel.replace("level", "").trim() || "experienced";
  const targetJob = config.targetJob;
  const personaStudioName =
    config.interviewMode === "job" && targetJob?.company ? targetJob.company : studio.name;
  const personaRole = targetJob?.title || config.roleType;

  return {
    name: `${studio.type} Interview Lead`,
    role: `${level} ${personaRole} interviewer`,
    studioName: personaStudioName,
    background: studio.description,
    style: studio.interviewStyle,
    experience: `${studio.location} / ${studio.type}`,
  };
}

type StudioRow = typeof studios.$inferSelect;

const firstPopulatedText = (...values: Array<string | null | undefined>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
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

async function resolveStudioContext(studioId: string): Promise<StudioContext> {
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

async function createAIService(): Promise<AIService> {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return AIService.fromSettings(settingsRows[0]);
}

function joinInterviewList(values: string[], maxItems = 6): string {
  const trimmed = values.map((value) => value.trim()).filter((value) => value.length > 0);
  if (trimmed.length === 0) {
    return DEFAULT_UNSPECIFIED_LABEL;
  }
  return trimmed.slice(0, maxItems).join(", ");
}

function summarizeUserProfileContext(
  row: typeof userProfile.$inferSelect | undefined,
): string {
  if (!row) {
    return "Candidate profile: not provided.";
  }

  const gamingExperience = isRecord(row.gamingExperience) ? row.gamingExperience : null;
  const specializations = parseStringArray(gamingExperience?.specializations);
  const shippedTitles = Array.isArray(gamingExperience?.shippedTitles)
    ? gamingExperience?.shippedTitles
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
- Shipped titles: ${joinInterviewList(shippedTitles, 4)}`;
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
- Experience highlights: ${joinInterviewList(experience, 4)}
- Project highlights: ${joinInterviewList(projects, 4)}
- Technical skills: ${joinInterviewList(technicalSkills)}
- Soft skills: ${joinInterviewList(softSkills)}`;
}

function summarizeCoverLetterContext(
  row: typeof coverLetters.$inferSelect | undefined,
): string {
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
      const technologies = Array.isArray(project.technologies) ? joinInterviewList(project.technologies, 3) : DEFAULT_UNSPECIFIED_LABEL;
      return `${project.title} (${parseString(project.role, "Role not specified")}; tech: ${technologies})`;
    });

  return `Portfolio context:
- Portfolio title: ${parseString(metadata?.title, DEFAULT_UNSPECIFIED_LABEL)}
- Portfolio summary: ${parseString(metadata?.description, parseString(metadata?.bio, DEFAULT_UNSPECIFIED_LABEL))}
- Featured work: ${joinInterviewList(featuredProjects, 3)}`;
}

async function resolvePreferredResume(
  candidateContext?: InterviewCandidateContext,
): Promise<typeof resumes.$inferSelect | undefined> {
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

async function resolvePreferredCoverLetter(
  candidateContext?: InterviewCandidateContext,
): Promise<typeof coverLetters.$inferSelect | undefined> {
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

async function resolvePreferredPortfolio(
  candidateContext?: InterviewCandidateContext,
): Promise<{
  portfolioRow?: typeof portfolios.$inferSelect;
  projectRows: Array<typeof portfolioProjects.$inferSelect>;
}> {
  const portfolioRows = candidateContext?.portfolioId
    ? await db.select().from(portfolios).where(eq(portfolios.id, candidateContext.portfolioId))
    : await db.select().from(portfolios).limit(1);
  const portfolioRow = portfolioRows[0];

  if (!portfolioRow) {
    return { projectRows: [] };
  }

  const projectRows = await db
    .select()
    .from(portfolioProjects)
    .where(eq(portfolioProjects.portfolioId, portfolioRow.id))
    .orderBy(desc(portfolioProjects.featured), portfolioProjects.sortOrder);
  return { portfolioRow, projectRows };
}

async function resolveCandidateInterviewContext(
  config: InterviewConfig,
): Promise<CandidateInterviewContext> {
  const [profileRows, resumeRow, coverLetterRow, portfolioSnapshot] = await Promise.all([
    db.select().from(userProfile).limit(1),
    resolvePreferredResume(config.candidateContext),
    resolvePreferredCoverLetter(config.candidateContext),
    resolvePreferredPortfolio(config.candidateContext),
  ]);

  return {
    conversationStyle: config.conversationStyle ?? DEFAULT_INTERVIEW_CONVERSATION_STYLE,
    profileSummary: summarizeUserProfileContext(profileRows[0]),
    resumeSummary: summarizeResumeContext(resumeRow),
    coverLetterSummary: summarizeCoverLetterContext(coverLetterRow),
    portfolioSummary: summarizePortfolioContext(
      portfolioSnapshot.portfolioRow,
      portfolioSnapshot.projectRows,
    ),
  };
}

function buildCandidatePromptContext(candidateContext: CandidateInterviewContext): string {
  return `${candidateContext.profileSummary}

${candidateContext.resumeSummary}

${candidateContext.coverLetterSummary}

${candidateContext.portfolioSummary}

Conversation style: ${candidateContext.conversationStyle}`;
}

function buildStudioPromptContext(studio: StudioContext): string {
  return `Studio context:
- Name: ${studio.name}
- Type: ${studio.type || DEFAULT_UNSPECIFIED_LABEL}
- Interview style: ${studio.interviewStyle || DEFAULT_UNSPECIFIED_LABEL}
- Technologies: ${studio.technologies.join(", ") || DEFAULT_UNSPECIFIED_LABEL}
- Key titles: ${studio.games.slice(0, 4).join(", ") || DEFAULT_UNSPECIFIED_LABEL}
- Remote: ${studio.remoteWork ? "supported" : "primarily on-site"}
- Persona summary: ${studio.enrichment?.summary || DEFAULT_UNSPECIFIED_LABEL}
- Hiring signals: ${studio.enrichment?.hiringSignals.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Interview focus areas: ${studio.enrichment?.interviewFocusAreas.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Candidate pitch angles: ${studio.enrichment?.candidatePitchAngles.join("; ") || DEFAULT_UNSPECIFIED_LABEL}`;
}

function buildJobPromptContext(config: InterviewConfig): string {
  const targetJob = config.targetJob;
  if (!targetJob || config.interviewMode !== "job") {
    return "Job context: not provided.";
  }

  return `Job context:
- Job title: ${targetJob.title}
- Company: ${targetJob.company}
- Location: ${targetJob.location}
- Technologies: ${targetJob.technologies?.join(", ") || DEFAULT_UNSPECIFIED_LABEL}
- Requirements: ${targetJob.requirements?.slice(0, 8).join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Description: ${targetJob.description || "Not provided"}
- Source: ${targetJob.source || "Unknown"}
- Persona summary: ${targetJob.enrichment?.summary || DEFAULT_UNSPECIFIED_LABEL}
- Hiring signals: ${targetJob.enrichment?.hiringSignals.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Interview focus areas: ${targetJob.enrichment?.interviewFocusAreas.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Candidate pitch angles: ${targetJob.enrichment?.candidatePitchAngles.join("; ") || DEFAULT_UNSPECIFIED_LABEL}`;
}

function buildQuestionGenerationPrompt(
  studio: StudioContext,
  config: InterviewConfig,
  candidateContext: CandidateInterviewContext,
): string {
  const targetJob = config.targetJob;
  const interviewEntity =
    config.interviewMode === "job" && targetJob?.company ? targetJob.company : studio.name;
  const roleTarget = targetJob?.title || config.roleType;
  const promptLevel =
    config.experienceLevel === "entry" ||
    config.experienceLevel === "mid" ||
    config.experienceLevel === "senior" ||
    config.experienceLevel === "lead"
      ? config.experienceLevel
      : INTERVIEW_DEFAULT_EXPERIENCE_LEVEL;
  const base = interviewQuestionPrompt(interviewEntity, roleTarget, promptLevel);
  const requestedQuestionCount =
    candidateContext.conversationStyle === "natural" ? 1 : config.questionCount;

  return `${base}\n\nInterview mode: ${config.interviewMode || DEFAULT_INTERVIEW_MODE}
Conversation style: ${candidateContext.conversationStyle}

${buildStudioPromptContext(studio)}

${buildJobPromptContext(config)}

${buildCandidatePromptContext(candidateContext)}

Constraints:
1. Return strict JSON array only.
2. Produce exactly ${requestedQuestionCount} question${requestedQuestionCount === 1 ? "" : "s"}.
3. Use types only from: technical|behavioral|studio-specific|intro|closing.
4. Apply include flags: technical=${config.includeTechnical}, behavioral=${config.includeBehavioral}, studio-specific=${config.includeStudioSpecific}.
5. Keep followUps concise and practical.
6. ExpectedDuration range 45-180.
7. Each question must have: id (string), question (string), type, followUps (array), expectedDuration (number), difficulty, tags (array).
8. Ground every question in the candidate context, not generic interview filler.
9. If conversation style is natural, ask one opening or follow-up question that references the candidate's background and the target role directly.
`;
}

function buildSimpleQuestionPrompt(role: string, level: string, count: number): string {
  return `Generate ${count} interview questions for a ${level}-level ${role} position in the game industry.
Return a JSON array only. Each object: {"id": "q1", "question": "...", "type": "technical|behavioral|studio-specific", "followUps": [], "expectedDuration": 90, "difficulty": "medium", "tags": []}.`;
}

function mapQuestionSetToConfig(raw: unknown): InterviewQuestion[] {
  const parsed = safeParseJSON(raw);
  const normalized = normalizeQuestions(Array.isArray(parsed) ? parsed : []);
  return normalized;
}

function normalizeSingleQuestion(raw: unknown): InterviewQuestion | null {
  return normalizeQuestions([raw])[0] ?? null;
}

function buildNaturalNextQuestionPrompt(input: {
  studio: StudioContext;
  config: InterviewConfig;
  candidateContext: CandidateInterviewContext;
  previousQuestion: InterviewQuestion;
  latestResponse: InterviewResponse;
  responses: InterviewResponse[];
}): string {
  const { studio, config, candidateContext, previousQuestion, latestResponse, responses } = input;

  return `${interviewPersonaPrompt({
    role: config.targetJob?.title || config.roleType,
    company: config.targetJob?.company || studio.name,
    personality: buildInterviewerPersona(studio, config).name,
    interviewStyle: studio.interviewStyle,
    focusAreas: config.focusAreas,
  })}

Interview mode: ${config.interviewMode || DEFAULT_INTERVIEW_MODE}
Conversation style: ${candidateContext.conversationStyle}
${buildStudioPromptContext(studio)}
${buildJobPromptContext(config)}
${buildCandidatePromptContext(candidateContext)}

Previous question:
${previousQuestion.question}

Latest candidate response:
${latestResponse.transcript}

Interview transcript so far:
${responses.map((response) => `- ${response.questionId}: ${response.transcript}`).join("\n")}

Return strict JSON only for the single best next question:
{
  "id": "q-next",
  "question": "string",
  "type": "technical|behavioral|studio-specific|intro|closing",
  "followUps": ["string"],
  "expectedDuration": 45-180,
  "difficulty": "easy|medium|hard",
  "tags": ["string"]
}

Constraints:
1. Ask exactly one follow-up question.
2. The question must build on the candidate's previous answer and candidate artifacts.
3. Avoid repeating previous questions.
4. Keep it conversational, specific, and role-relevant.`;
}

function buildFallbackNaturalQuestion(
  session: InterviewSession,
  studio: StudioContext,
  candidateContext: CandidateInterviewContext,
): InterviewQuestion | null {
  const nextFallback = buildFallbackQuestions(
    {
      ...session.config,
      questionCount: session.config.questionCount,
    },
    studio,
    candidateContext,
  )[session.responses.length];
  if (!nextFallback) {
    return null;
  }
  return {
    ...nextFallback,
    id: `natural-fallback-${session.responses.length + 1}`,
  };
}

async function generateNextNaturalQuestion(
  session: InterviewSession,
  studio: StudioContext,
  latestResponse: InterviewResponse,
  previousQuestion: InterviewQuestion,
): Promise<InterviewQuestion | null> {
  const candidateContext = await resolveCandidateInterviewContext(session.config);
  const aiServiceResult = await settle(createAIService());
  if (aiServiceResult.status === "rejected") {
    return buildFallbackNaturalQuestion(session, studio, candidateContext);
  }

  const prompt = buildNaturalNextQuestionPrompt({
    studio,
    config: session.config,
    candidateContext,
    previousQuestion,
    latestResponse,
    responses: [...session.responses, latestResponse],
  });

  const response = (await withAiOperationTimeout(() =>
    aiServiceResult.value.generate(prompt, {
      purpose: "interviewQuestions",
      temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW,
      maxTokens: AI_MAX_TOKENS_QUESTION,
    }),
  )) ?? null;
  if (!response || response.error) {
    return buildFallbackNaturalQuestion(session, studio, candidateContext);
  }

  const parsed = normalizeSingleQuestion(safeParseJSON(response.content));
  if (parsed) {
    return {
      ...parsed,
      id: `natural-${session.responses.length + 2}`,
    };
  }

  return buildFallbackNaturalQuestion(session, studio, candidateContext);
}

async function generateQuestions(
  config: InterviewConfig,
  studio: StudioContext,
): Promise<InterviewQuestion[]> {
  const aiService = await createAIService();
  const candidateContext = await resolveCandidateInterviewContext(config);
  const fullPrompt = buildQuestionGenerationPrompt(studio, config, candidateContext);
  const role = config.targetJob?.title || config.roleType;
  const level = config.experienceLevel;

  const tryGenerate = async (prompt: string): Promise<InterviewQuestion[]> => {
    const response = (await withAiOperationTimeout(() =>
      aiService.generate(prompt, {
        purpose: "interviewQuestions",
        temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS,
        maxTokens: AI_MAX_TOKENS_ANALYSIS,
      }),
    )) ?? {
      error: API_ERROR_AI_OPERATION_TIMEOUT,
      content: "",
      provider: "none",
      id: "",
      timing: { startedAt: 0, completedAt: 0, totalTime: 0 },
    };

    if (response.error) throw new Error(response.error);

    const parsed = mapQuestionSetToConfig(response.content).filter((question) => {
      if (question.type === "technical" && !config.includeTechnical) return false;
      if (question.type === "behavioral" && !config.includeBehavioral) return false;
      if (question.type === "studio-specific" && !config.includeStudioSpecific) return false;
      return true;
    });

    if (parsed.length === 0) throw new Error(API_ERROR_AI_NO_QUESTIONS);
    return parsed.slice(
      0,
      candidateContext.conversationStyle === "natural" ? 1 : config.questionCount,
    );
  };

  const primaryResult = await settle(tryGenerate(fullPrompt));
  if (primaryResult.status === "fulfilled") {
    return primaryResult.value;
  }
  interviewServiceLogger.warn(
    "AI question generation failed on primary prompt, attempting fallback prompt.",
    toErrorMessage(primaryResult.reason),
  );
  const fallbackResult = await settle(
    tryGenerate(buildSimpleQuestionPrompt(role, level, config.questionCount)),
  );
  if (fallbackResult.status === "fulfilled") {
    return fallbackResult.value;
  }
  interviewServiceLogger.warn(
    "AI question generation failed on fallback prompt, using deterministic local questions.",
    toErrorMessage(fallbackResult.reason),
  );
  return buildFallbackQuestions(config, studio, candidateContext);
}

function buildResponseFeedbackPrompt(input: {
  studio: StudioContext;
  config: InterviewConfig;
  candidateContext: CandidateInterviewContext;
  persona: InterviewerPersona;
  question: InterviewQuestion;
  responseText: string;
  priorResponses: InterviewResponse[];
}): string {
  const { studio, config, candidateContext, persona, question, responseText, priorResponses } =
    input;
  return `${interviewPersonaPrompt({
    role: config.targetJob?.title || config.roleType,
    company: config.targetJob?.company || studio.name,
    personality: persona.name,
    interviewStyle: studio.interviewStyle,
    focusAreas: config.focusAreas,
  })}

Interview mode: ${config.interviewMode || DEFAULT_INTERVIEW_MODE}
Conversation style: ${candidateContext.conversationStyle}
${buildStudioPromptContext(studio)}
${buildJobPromptContext(config)}
${buildCandidatePromptContext(candidateContext)}

Prior answers:
${priorResponses.length > 0 ? priorResponses.map((response) => `- ${response.questionId}: ${response.transcript}`).join("\n") : "- None yet"}

Question asked:
${question.question}

Candidate response:
${responseText}

Return strict JSON only:
{
  "score": 0-100,
  "feedback": "One paragraph feedback",
  "strengths": ["..."],
  "improvements": ["..."]
}
Use the existing structure as baseline:
${interviewFeedbackPrompt(question.question, responseText)}
`;
}

function normalizeQuestionFeedback(
  raw: unknown,
): NonNullable<InterviewResponse["aiAnalysis"]> | null {
  if (!isRecord(raw)) return null;
  const parsedScore =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.score === "string"
        ? Number.parseInt(raw.score, DECIMAL_RADIX)
        : Number.NaN;
  if (!Number.isFinite(parsedScore)) return null;

  return {
    score: normalizeScore(parsedScore),
    feedback: typeof raw.feedback === "string" && raw.feedback.trim() ? raw.feedback.trim() : "",
    strengths: parseStringArray(raw.strengths),
    improvements: parseStringArray(raw.improvements),
  };
}

async function generateResponseFeedback(
  session: InterviewSession,
  studio: StudioContext,
  question: InterviewQuestion,
  transcript: string,
): Promise<NonNullable<InterviewResponse["aiAnalysis"]>> {
  if (transcript.trim().length === 0) {
    return {
      score: 0,
      feedback: "Response is empty and cannot be assessed.",
      strengths: [],
      improvements: ["Provide a complete and structured response."],
    };
  }

  const persona = buildInterviewerPersona(studio, session.config);
  const candidateContext = await resolveCandidateInterviewContext(session.config);
  const prompt = buildResponseFeedbackPrompt({
    studio,
    config: session.config,
    candidateContext,
    persona,
    question,
    responseText: transcript,
    priorResponses: session.responses,
  });
  const aiServiceResult = await settle(createAIService());
  if (aiServiceResult.status === "rejected") {
    return fallbackResponseFeedback(transcript);
  }

  const response = (await withAiOperationTimeout(() =>
    aiServiceResult.value.generate(prompt, {
      purpose: "interviewFeedback",
      temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW,
      maxTokens: AI_MAX_TOKENS_FEEDBACK,
    }),
  )) ?? {
    error: API_ERROR_AI_OPERATION_TIMEOUT,
    content: "",
    provider: "none",
    id: "",
    timing: { startedAt: 0, completedAt: 0, totalTime: 0 },
  };

  if (response.error) {
    return fallbackResponseFeedback(transcript);
  }

  const parsedPayload = safeParseJSON(response.content) ?? {
    score: Number.NaN,
    feedback: "",
    strengths: [],
    improvements: [],
  };
  const parsed = normalizeQuestionFeedback(parsedPayload);
  if (!parsed) return fallbackResponseFeedback(transcript);
  if (parsed.feedback === "") {
    parsed.feedback = "Good response with room for greater specificity.";
  }

  return parsed;
}

function calculateDefaultAnalysis(responses: InterviewResponse[]): InterviewAnalysis {
  if (responses.length === 0) {
    return {
      overallScore: 0,
      strengths: [],
      improvements: ["Complete all responses for a full analysis."],
      recommendations: ["Answer with measurable outcomes and concrete examples."],
      feedback: "No responses were recorded.",
    };
  }

  const validScores = responses
    .map((entry) => entry.aiAnalysis?.score)
    .filter((value): value is number => typeof value === "number");

  const average =
    validScores.length > 0
      ? Math.round(validScores.reduce((sum, value) => sum + value, 0) / validScores.length)
      : 0;

  const strengths = Array.from(
    new Set(responses.flatMap((response) => response.aiAnalysis?.strengths || [])),
  );
  const improvements = Array.from(
    new Set(responses.flatMap((response) => response.aiAnalysis?.improvements || [])),
  );

  return {
    overallScore: average,
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 5),
    recommendations:
      average >= SCORE_PASS_THRESHOLD
        ? ["Sustain your structured communication and add extra quantification."]
        : average >= SCORE_WARNING_THRESHOLD
          ? ["Work on measurable examples and deeper technical justification."]
          : ["Practice response structure using situation, action, result examples."],
    feedback:
      average >= SCORE_PASS_THRESHOLD
        ? "Strong session across technical and behavioral areas."
        : "Good foundation; improve depth, metrics, and real project examples.",
  };
}

function buildFinalAnalysisPrompt({
  studio,
  config,
  responses,
  persona,
  candidateContext,
}: FinalAnalysisPromptContext): string {
  const responseLines = responses.map(
    (response, index) => `Q${index + 1}: "${response.questionId}"\nA${index + 1}: ${response.transcript}`,
  );

  return `${interviewPersonaPrompt({
    role: config.targetJob?.title || config.roleType,
    company: config.targetJob?.company || studio.name,
    personality: persona.name,
    interviewStyle: studio.interviewStyle,
    focusAreas: config.focusAreas,
  })}
Interview mode: ${config.interviewMode || DEFAULT_INTERVIEW_MODE}
Conversation style: ${candidateContext.conversationStyle}
${buildStudioPromptContext(studio)}
${buildJobPromptContext(config)}
${buildCandidatePromptContext(candidateContext)}
You are analyzing the following interview responses.

Responses:
${responseLines.join("\n")}

Return strict JSON only:
{
  "overallScore": 0-100,
  "strengths": ["..."],
  "improvements": ["..."],
  "recommendations": ["..."],
  "feedback": "Short summary"
}
`;
}

function normalizeFinalFromAI(raw: unknown): InterviewAnalysis | null {
  const parsed = safeParseJSON(raw) ?? {
    overallScore: Number.NaN,
    strengths: [],
    improvements: [],
    recommendations: [],
  };

  if (!isRecord(parsed)) return null;

  if (typeof parsed.overallScore !== "number" || !Number.isFinite(parsed.overallScore)) {
    return null;
  }

  const feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";

  return {
    overallScore: normalizeScore(parsed.overallScore),
    strengths: parseStringArray(parsed.strengths),
    improvements: parseStringArray(parsed.improvements),
    recommendations: parseStringArray(parsed.recommendations),
    ...(feedback ? { feedback } : {}),
  };
}

async function generateFinalAnalysis(
  session: InterviewSession,
  studio: StudioContext,
): Promise<InterviewAnalysis> {
  const persona = buildInterviewerPersona(studio, session.config);
  const candidateContext = await resolveCandidateInterviewContext(session.config);
  const prompt = buildFinalAnalysisPrompt({
    studio,
    config: session.config,
    responses: session.responses,
    persona,
    candidateContext,
  });
  const aiServiceResult = await settle(createAIService());
  if (aiServiceResult.status === "rejected") {
    return calculateDefaultAnalysis(session.responses);
  }

  const response =
    (await withAiOperationTimeout(() =>
      aiServiceResult.value.generate(prompt, {
        purpose: "interviewFeedback",
        temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW,
        maxTokens: AI_MAX_TOKENS_QUESTION,
      }),
    )) ?? null;

  if (!response || response.error) return calculateDefaultAnalysis(session.responses);

  const parsed = normalizeFinalFromAI(response.content);
  if (parsed) return parsed;
  return calculateDefaultAnalysis(session.responses);
}

function normalizeSessionConfig(row: DBInterviewSession): InterviewConfig {
  return normalizeConfig(isRecord(row.config) ? row.config : {});
}

async function toInterviewSession(
  row: DBInterviewSession,
  studioContext?: StudioContext,
): Promise<InterviewSession> {
  const config = normalizeSessionConfig(row);
  const studio = studioContext ?? (await resolveStudioContext(row.studioId));
  const questions = normalizeQuestions(row.questions);
  const responses = normalizeResponses(row.responses);
  const finalAnalysis = normalizeFinalAnalysis(row.finalAnalysis);

  return {
    id: row.id,
    studioId: row.studioId,
    config,
    questions,
    currentQuestionIndex: Math.min(responses.length, questions.length),
    totalQuestions: questions.length,
    startTime: row.startTime || Date.now(),
    status: normalizeInterviewSessionStatus(row.status),
    responses,
    interviewerPersona: buildInterviewerPersona(studio, config),
    ...(row.endTime ? { endTime: row.endTime } : {}),
    ...(finalAnalysis ? { finalAnalysis } : {}),
  };
}

/**
 * Interview service layer for session lifecycle and studio-aware analysis.
 */
export class InterviewService {
  /**
   * Start a new studio-aware interview session.
   */
  async startSession(
    studioId: string,
    rawConfig?: InterviewConfigInput,
  ): Promise<InterviewSession> {
    const config = normalizeConfig(rawConfig || {});
    const studio = await resolveStudioContext(studioId);
    const questionSet = await generateQuestions(config, studio);

    const id = generateId();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const persistedConfig = toPersistedRecord(config);

    await db.insert(interviewSessions).values({
      id,
      studioId: studio.id,
      config: persistedConfig,
      questions: questionSet,
      responses: [],
      finalAnalysis: null,
      status: "active",
      startTime: now,
      endTime: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const row: DBInterviewSession = {
      id,
      studioId: studio.id,
      config: persistedConfig,
      questions: questionSet,
      responses: [],
      finalAnalysis: null,
      status: "active",
      startTime: now,
      endTime: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return toInterviewSession(row, studio);
  }

  /**
   * Fetch all interview sessions in reverse-chronological order.
   */
  async getSessions(): Promise<InterviewSession[]> {
    const sessions = await db
      .select()
      .from(interviewSessions)
      .orderBy(desc(interviewSessions.createdAt));
    return Promise.all(sessions.map((session) => toInterviewSession(session)));
  }

  /**
   * Fetch one interview session.
   */
  async getSession(id: string): Promise<InterviewSession | null> {
    const rows = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id));
    if (rows.length === 0) return null;
    return toInterviewSession(rows[0]);
  }

  private selectQuestionForResponse(
    session: InterviewSession,
    response: InterviewResponse,
  ): InterviewQuestion | null {
    const questions = session.questions;
    const matchedQuestion = questions.find((entry) => entry.id === response.questionId);
    return (
      matchedQuestion ??
      questions[session.currentQuestionIndex] ??
      questions[questions.length - 1] ??
      null
    );
  }

  private buildAnalyzedResponse(
    response: InterviewResponse,
    questionId: string,
    analysis: NonNullable<InterviewResponse["aiAnalysis"]>,
  ): InterviewResponse {
    return {
      ...response,
      questionId,
      duration: Math.max(1, response.duration),
      transcript: response.transcript.trim(),
      timestamp: response.timestamp || Date.now(),
      confidence: Math.max(0, Math.min(1, response.confidence || 0.8)),
      aiAnalysis: analysis,
    };
  }

  private async persistSessionResponses(options: {
    sessionId: string;
    responses: InterviewResponse[];
    questions: InterviewQuestion[];
    endTime: number | null;
    nowIso: string;
  }): Promise<InterviewSession["status"]> {
    const status: InterviewSession["status"] =
      options.responses.length >= options.questions.length ? "completed" : "active";
    await db
      .update(interviewSessions)
      .set({
        responses: options.responses,
        questions: options.questions,
        status,
        endTime: status === "completed" ? Date.now() : options.endTime,
        updatedAt: options.nowIso,
      })
      .where(eq(interviewSessions.id, options.sessionId));
    return status;
  }

  private async persistFinalAnalysis(
    sessionId: string,
    studioContext: StudioContext,
    nowIso: string,
  ): Promise<void> {
    const finalized = await this.getSession(sessionId);
    if (!finalized) {
      return;
    }
    const finalAnalysis = await generateFinalAnalysis(finalized, studioContext);
    const persistedFinalAnalysis = toPersistedRecord(finalAnalysis);
    await db
      .update(interviewSessions)
      .set({
        finalAnalysis: persistedFinalAnalysis,
        updatedAt: nowIso,
      })
      .where(eq(interviewSessions.id, sessionId));
  }

  /**
   * Add one candidate response and generate AI-backed feedback.
   */
  async addResponse(
    sessionId: string,
    response: InterviewResponse,
  ): Promise<InterviewSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    if (session.status === "completed") return session;

    const question = this.selectQuestionForResponse(session, response);
    if (!question) return session;

    const studioContext = await resolveStudioContext(session.studioId);
    const analysis = await generateResponseFeedback(
      session,
      studioContext,
      question,
      response.transcript,
    );
    const nowIso = new Date().toISOString();
    const responseWithAnalysis = this.buildAnalyzedResponse(response, question.id, analysis);
    const responses = [...session.responses, responseWithAnalysis];
    const shouldGenerateFollowUp =
      session.config.conversationStyle === "natural" &&
      responses.length < session.config.questionCount;
    const followUpQuestion = shouldGenerateFollowUp
      ? await generateNextNaturalQuestion(session, studioContext, responseWithAnalysis, question)
      : null;
    const questions =
      followUpQuestion && !session.questions.some((entry) => entry.id === followUpQuestion.id)
        ? [...session.questions, followUpQuestion]
        : session.questions;
    const status = await this.persistSessionResponses({
      sessionId,
      responses,
      questions,
      endTime: session.endTime ?? null,
      nowIso,
    });

    if (status === "completed") {
      await this.persistFinalAnalysis(sessionId, studioContext, nowIso);
    }

    return this.getSession(sessionId);
  }

  /**
   * Mark interview session complete and run final AI summary generation.
   */
  async completeSession(id: string): Promise<InterviewSession | null> {
    const session = await this.getSession(id);
    if (!session) return null;
    if (session.status === "completed") return session;

    const studioContext = await resolveStudioContext(session.studioId);
    const finalAnalysis = await generateFinalAnalysis(session, studioContext);
    const persistedFinalAnalysis = toPersistedRecord(finalAnalysis);

    const now = new Date().toISOString();
    await db
      .update(interviewSessions)
      .set({
        status: "completed",
        endTime: Date.now(),
        finalAnalysis: persistedFinalAnalysis,
        updatedAt: now,
      })
      .where(eq(interviewSessions.id, id));

    return this.getSession(id);
  }

  /**
   * Get summary statistics for interview sessions.
   */
  async getStats(): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    strongestAreas: string[];
    improvementAreas: string[];
    totalTimeSpent: number;
    favoriteStudios: string[];
  }> {
    const sessions = await this.getSessions();
    const totalInterviews = sessions.length;
    const completedInterviews = sessions.filter((session) => session.status === "completed").length;
    const completedWithScore = sessions.filter(
      (session) => session.status === "completed" && session.finalAnalysis,
    );
    const averageScore =
      completedWithScore.length > 0
        ? Math.round(
            completedWithScore.reduce(
              (acc, session) => acc + (session.finalAnalysis?.overallScore || 0),
              0,
            ) / completedWithScore.length,
          )
        : 0;

    const strongestAreas = [
      ...new Set(sessions.flatMap((session) => session.finalAnalysis?.strengths || [])),
    ].slice(0, 3);
    const improvementAreas = [
      ...new Set(sessions.flatMap((session) => session.finalAnalysis?.improvements || [])),
    ].slice(0, 3);
    const totalTimeSpent = sessions.reduce((acc, session) => {
      if (session.startTime && session.endTime) {
        return acc + (session.endTime - session.startTime);
      }
      return acc;
    }, 0);
    const studioCounts = new Map<string, number>();
    for (const session of sessions) {
      studioCounts.set(session.studioId, (studioCounts.get(session.studioId) ?? 0) + 1);
    }
    const favoriteStudios = [...studioCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([studioId]) => studioId);

    return {
      totalInterviews,
      completedInterviews,
      averageScore,
      strongestAreas,
      improvementAreas,
      totalTimeSpent,
      favoriteStudios,
    };
  }
}

export const interviewService = new InterviewService();
