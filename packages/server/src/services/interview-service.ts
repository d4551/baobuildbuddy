import {
  type InterviewAnalysis,
  type InterviewConfig,
  type InterviewMode,
  type InterviewQuestion,
  type InterviewResponse,
  type InterviewSession,
  type InterviewTargetJob,
  type InterviewerPersona,
  type VoiceSettings,
  INTERVIEW_DEFAULT_DURATION_MINUTES,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_FOCUS_AREAS,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_CATEGORY,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
  INTERVIEW_FALLBACK_STUDIO_ID,
  generateId,
} from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { interviewSessions } from "../db/schema/interviews";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { studios } from "../db/schema/studios";
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

const MAX_QUESTION_COUNT = 12;
const DEFAULT_INTERVIEW_MODE: InterviewMode = "studio";
const AI_OPERATION_TIMEOUT_MS = 1200;
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
  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`AI operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function buildFallbackQuestions(config: InterviewConfig, studioName: string): InterviewQuestion[] {
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
    questions.push({
      ...seed,
      id: `fallback-${questions.length + 1}`,
      question: `For ${studioName}, ${seed.question}`.replace(/^\s*For\s*/, `For ${studioName}, `),
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
    const parsed = Number.parseInt(value, 10);
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

function normalizeInterviewTargetJob(value: unknown): InterviewTargetJob | undefined {
  if (!isRecord(value)) return undefined;

  const id = parseString(value.id, "");
  const title = parseString(value.title, "");
  const company = parseString(value.company, "");
  const location = parseString(value.location, "");

  if (!id || !title || !company || !location) {
    return undefined;
  }

  const requirements = parseStringArray(value.requirements);
  const technologies = parseStringArray(value.technologies);
  const description = parseString(value.description, "");
  const source = parseString(value.source, "");
  const postedDate = parseString(value.postedDate, "");
  const url = parseString(value.url, "");

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

  return targetJob;
}

function normalizeVoiceSettings(raw: unknown): VoiceSettings | undefined {
  if (!isRecord(raw)) return undefined;

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
    MAX_QUESTION_COUNT,
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
    targetJob,
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

  const codeFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1].trim();
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
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
  try {
    return JSON.parse(extracted);
  } catch {
    return null;
  }
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
  _question: InterviewQuestion,
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
      studio.remoteWork === true || (studio.remoteWork !== false && fallbackStudio?.remoteWork === true),
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

function buildJobPromptContext(config: InterviewConfig): string {
  const targetJob = config.targetJob;
  if (!targetJob || config.interviewMode !== "job") {
    return "Job context: not provided.";
  }

  return `Job context:
- Job title: ${targetJob.title}
- Company: ${targetJob.company}
- Location: ${targetJob.location}
- Technologies: ${targetJob.technologies?.join(", ") || "Not specified"}
- Requirements: ${targetJob.requirements?.slice(0, 8).join("; ") || "Not specified"}
- Description: ${targetJob.description || "Not provided"}
- Source: ${targetJob.source || "Unknown"}`;
}

function buildQuestionGenerationPrompt(studio: StudioContext, config: InterviewConfig): string {
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
  const base = interviewQuestionPrompt(
    interviewEntity,
    roleTarget,
    promptLevel,
  );

  return `${base}\n\nInterview mode: ${config.interviewMode || DEFAULT_INTERVIEW_MODE}

Studio context:
- Name: ${studio.name}
- Type: ${studio.type}
- Interview style: ${studio.interviewStyle}
- Technologies: ${studio.technologies.join(", ") || "TBD"}
- Key titles: ${studio.games.slice(0, 4).join(", ") || "General game production context"}
- Remote: ${studio.remoteWork ? "supported" : "primarily on-site"}

${buildJobPromptContext(config)}

Constraints:
1. Return strict JSON array only.
2. Produce exactly ${config.questionCount} questions.
3. Use types only from: technical|behavioral|studio-specific|intro|closing.
4. Apply include flags: technical=${config.includeTechnical}, behavioral=${config.includeBehavioral}, studio-specific=${config.includeStudioSpecific}.
5. Keep followUps concise and practical.
6. ExpectedDuration range 45-180.
7. Each question must have: id (string), question (string), type, followUps (array), expectedDuration (number), difficulty, tags (array).
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

async function generateQuestions(
  config: InterviewConfig,
  studio: StudioContext,
): Promise<InterviewQuestion[]> {
  const aiService = await createAIService();
  const fullPrompt = buildQuestionGenerationPrompt(studio, config);
  const role = config.targetJob?.title || config.roleType;
  const level = config.experienceLevel;

  const tryGenerate = async (prompt: string): Promise<InterviewQuestion[]> => {
    const response = (await withAiOperationTimeout(() =>
      aiService.generate(prompt, {
        temperature: 0.65,
        maxTokens: 1200,
      }),
    )) ?? {
      error: "AI operation timed out",
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

    if (parsed.length === 0) throw new Error("AI returned no valid questions");
    return parsed.slice(0, config.questionCount);
  };

  try {
    return await tryGenerate(fullPrompt);
  } catch (firstErr) {
    console.warn(
      "AI question generation failed on primary prompt, attempting fallback prompt.",
      firstErr instanceof Error ? firstErr.message : "Unknown error",
    );
    try {
      return await tryGenerate(buildSimpleQuestionPrompt(role, level, config.questionCount));
    } catch (secondErr) {
      console.warn(
        "AI question generation failed on fallback prompt, using deterministic local questions.",
        secondErr instanceof Error ? secondErr.message : "Unknown error",
      );
      return buildFallbackQuestions(config, config.targetJob?.company || studio.name);
    }
  }
}

function buildResponseFeedbackPrompt(
  studio: StudioContext,
  config: InterviewConfig,
  persona: InterviewerPersona,
  question: InterviewQuestion,
  responseText: string,
): string {
  return `${interviewPersonaPrompt(
    config.targetJob?.title || config.roleType,
    config.targetJob?.company || studio.name,
    persona.name,
    studio.interviewStyle,
    config.focusAreas,
  )}

Interview mode: ${config.interviewMode || DEFAULT_INTERVIEW_MODE}
${buildJobPromptContext(config)}

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
    typeof raw.score === "number" ? raw.score : Number.parseInt(String(raw.score || ""), 10);
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
  const prompt = buildResponseFeedbackPrompt(studio, session.config, persona, question, transcript);
  try {
    const aiService = await createAIService();
    const response = (await withAiOperationTimeout(() =>
      aiService.generate(prompt, {
        temperature: 0.35,
        maxTokens: 500,
      }),
    )) ?? {
      error: "AI operation timed out",
      content: "",
      provider: "none",
      id: "",
      timing: { startedAt: 0, completedAt: 0, totalTime: 0 },
    };

    if (response.error) {
      return fallbackResponseFeedback(transcript, question);
    }

    const parsedPayload = safeParseJSON(response.content) ?? {
      score: Number.NaN,
      feedback: "",
      strengths: [],
      improvements: [],
    };
    const parsed = normalizeQuestionFeedback(parsedPayload);
    if (!parsed) return fallbackResponseFeedback(transcript, question);
    if (parsed.feedback === "") {
      parsed.feedback = "Good response with room for greater specificity.";
    }

    return parsed;
  } catch {
    return fallbackResponseFeedback(transcript, question);
  }
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
      average >= 80
        ? ["Sustain your structured communication and add extra quantification."]
        : average >= 65
          ? ["Work on measurable examples and deeper technical justification."]
          : ["Practice response structure using situation, action, result examples."],
    feedback:
      average >= 80
        ? "Strong session across technical and behavioral areas."
        : "Good foundation; improve depth, metrics, and real project examples.",
  };
}

function buildFinalAnalysisPrompt(
  studio: StudioContext,
  config: InterviewConfig,
  responses: InterviewResponse[],
  persona: InterviewerPersona,
): string {
  const responseLines = responses.map(
    (response, index) => `Q${index + 1}: "${response.questionId}"`,
  );

  return `${interviewPersonaPrompt(
    config.targetJob?.title || config.roleType,
    config.targetJob?.company || studio.name,
    persona.name,
    studio.interviewStyle,
    config.focusAreas,
  )}
Interview mode: ${config.interviewMode || DEFAULT_INTERVIEW_MODE}
${buildJobPromptContext(config)}
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
  const parsed =
    safeParseJSON(raw) ?? {
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
  const prompt = buildFinalAnalysisPrompt(studio, session.config, session.responses, persona);

  try {
    const aiService = await createAIService();
    const response =
      (await withAiOperationTimeout(() =>
        aiService.generate(prompt, {
          temperature: 0.35,
          maxTokens: 900,
        }),
      )) ?? null;

    if (!response || response.error) return calculateDefaultAnalysis(session.responses);

    const parsed = normalizeFinalFromAI(response.content);
    if (parsed) return parsed;
  } catch {
    return calculateDefaultAnalysis(session.responses);
  }

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

    const questions = session.questions;
    const matchedQuestion = questions.find((entry) => entry.id === response.questionId);
    const question =
      matchedQuestion ?? questions[session.currentQuestionIndex] ?? questions[questions.length - 1];
    if (!question) return session;

    const studioContext = await resolveStudioContext(session.studioId);
    const analysis = await generateResponseFeedback(
      session,
      studioContext,
      question,
      response.transcript,
    );
    const now = new Date().toISOString();
    const responseWithAnalysis: InterviewResponse = {
      ...response,
      questionId: question.id,
      duration: Math.max(1, response.duration),
      transcript: response.transcript.trim(),
      timestamp: response.timestamp || Date.now(),
      confidence: Math.max(0, Math.min(1, response.confidence || 0.8)),
      aiAnalysis: analysis,
    };

    const responses = [...session.responses, responseWithAnalysis];
    const status: InterviewSession["status"] =
      responses.length >= questions.length ? "completed" : "active";
    await db
      .update(interviewSessions)
      .set({
        responses,
        status,
        endTime: status === "completed" ? Date.now() : session.endTime,
        updatedAt: now,
      })
      .where(eq(interviewSessions.id, sessionId));

    if (status === "completed") {
      const finalized = await this.getSession(sessionId);
      if (!finalized) return null;
      const finalAnalysis = await generateFinalAnalysis(finalized, studioContext);
      const persistedFinalAnalysis = toPersistedRecord(finalAnalysis);
      await db
        .update(interviewSessions)
        .set({
          finalAnalysis: persistedFinalAnalysis,
          updatedAt: now,
        })
        .where(eq(interviewSessions.id, sessionId));
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
