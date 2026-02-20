import {
  type InterviewAnalysis,
  type InterviewConfig,
  type InterviewQuestion,
  type InterviewResponse,
  type InterviewSession,
  type InterviewerPersona,
  type VoiceSettings,
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
type DBStudio = typeof studios.$inferSelect;
type InterviewConfigInput = Record<string, unknown>;
type JsonRecord = Record<string, unknown>;
type JsonArray = unknown[];

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

const DEFAULT_FOCUS_AREAS = ["architecture", "collaboration", "problem-solving"];
const MAX_QUESTION_COUNT = 12;
const FALLBACK_INTERVIEW_LEVEL = "mid-level";
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

const FALLBACK_STUDIO_CONTEXT: Omit<StudioContext, "id"> = {
  name: "Unknown Studio",
  description: "Studio context unavailable; using generic technical interview defaults.",
  interviewStyle: "balanced",
  technologies: [],
  games: [],
  culture: {},
  location: "Unknown",
  type: "Unknown",
  remoteWork: false,
};

const questionTypePattern = new Set<string>([
  "behavioral",
  "technical",
  "studio-specific",
  "intro",
  "closing",
]);

const difficultyPattern = new Set<string>(["easy", "medium", "hard"]);
const INTERVIEW_SESSION_STATUSES = new Set<InterviewSession["status"]>([
  "preparing",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

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

function normalizeVoiceSettings(raw: unknown): VoiceSettings | undefined {
  if (!isRecord(raw)) return undefined;

  const microphoneId = parseString(raw.microphoneId, "");
  const speakerId = parseString(raw.speakerId, "");
  const voiceId = parseString(raw.voiceId, "");

  return {
    microphoneId: microphoneId || undefined,
    speakerId: speakerId || undefined,
    voiceId: voiceId || undefined,
    rate: parseNumber(raw.rate, 1, 0.25, 3),
    pitch: parseNumber(raw.pitch, 1, 0.5, 2),
    volume: parseNumber(raw.volume, 1, 0, 2),
    language: parseString(raw.language, "en-US"),
  };
}

/**
 * Normalize interview configuration from legacy and modern callers.
 */
function normalizeConfig(raw: InterviewConfigInput): InterviewConfig {
  const questionCount = parseNumber(raw.questionCount, 6, 1, MAX_QUESTION_COUNT);
  const duration = parseNumber(raw.duration, 25, 5, 120);
  const experienceLevel = normalizeExperienceLevel(
    parseString(raw.experienceLevel, FALLBACK_INTERVIEW_LEVEL),
  );
  const roleType = parseString(raw.roleType, parseString(raw.role, "Game Developer"));
  const roleCategory = parseString(raw.roleCategory, "General");
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
    focusAreas: focusAreas.length > 0 ? focusAreas : [...DEFAULT_FOCUS_AREAS],
    duration,
    questionCount,
    includeTechnical,
    includeBehavioral,
    includeStudioSpecific,
    enableVoiceMode,
    technologies,
    voiceSettings,
  };
}

/**
 * Normalize legacy interview level values to consistent format.
 */
function normalizeExperienceLevel(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("lead")) return "lead";
  if (normalized.includes("senior")) return "senior";
  if (normalized.includes("entry") || normalized.includes("junior")) return "entry";
  if (normalized.includes("mid")) return "mid";
  return FALLBACK_INTERVIEW_LEVEL;
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
      aiAnalysis: aiAnalysis
        ? {
            score: normalizeAiAnalysisScore(aiAnalysis.score),
            feedback: typeof aiAnalysis.feedback === "string" ? aiAnalysis.feedback : "",
            strengths: parseStringArray(aiAnalysis.strengths),
            improvements: parseStringArray(aiAnalysis.improvements),
          }
        : undefined,
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

  return {
    overallScore: normalizeScore(raw.overallScore),
    strengths: parseStringArray(raw.strengths),
    improvements: parseStringArray(raw.improvements),
    recommendations: parseStringArray(raw.recommendations),
    feedback: typeof raw.feedback === "string" ? raw.feedback : undefined,
  };
}

function normalizeInterviewSessionStatus(value: unknown): InterviewSession["status"] {
  return typeof value === "string" &&
    INTERVIEW_SESSION_STATUSES.has(value as InterviewSession["status"])
    ? (value as InterviewSession["status"])
    : "active";
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
 * Parse JSON with deterministic fallback.
 */
function safeParseJSON<T>(payload: unknown, fallback: T): T {
  if (typeof payload !== "string") return fallback;
  const extracted = extractJSON(payload);
  try {
    return JSON.parse(extracted) as T;
  } catch {
    return fallback;
  }
}

function normalizeScore(value: number): number {
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
  question: InterviewQuestion,
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
  const personality = `Professional interviewer with ${studio.type} studio perspective`;
  const level = config.experienceLevel.replace("level", "").trim() || "experienced";

  return {
    name: `${studio.type} Interview Lead`,
    role: `${level} ${config.roleType} interviewer`,
    studioName: studio.name,
    background: studio.description,
    style: studio.interviewStyle,
    experience: `${studio.location} / ${studio.type}`,
  };
}

async function resolveStudioContext(studioId: string): Promise<StudioContext> {
  const rows = await db.select().from(studios).where(eq(studios.id, studioId));
  if (rows.length === 0) {
    return {
      ...FALLBACK_STUDIO_CONTEXT,
      id: studioId,
    };
  }

  const studio = rows[0];
  return {
    id: studio.id,
    name: studio.name,
    description: studio.description ?? FALLBACK_STUDIO_CONTEXT.description,
    interviewStyle: studio.interviewStyle ?? FALLBACK_STUDIO_CONTEXT.interviewStyle,
    technologies: parseStringArray(studio.technologies),
    games: parseStringArray(studio.games),
    culture: isRecord(studio.culture) ? studio.culture : {},
    location: studio.location ?? FALLBACK_STUDIO_CONTEXT.location,
    type: studio.type ?? FALLBACK_STUDIO_CONTEXT.type,
    remoteWork: studio.remoteWork === true,
  };
}

async function createAIService(): Promise<AIService> {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return AIService.fromSettings(settingsRows[0]);
}

function buildQuestionGenerationPrompt(studio: StudioContext, config: InterviewConfig): string {
  const base = interviewQuestionPrompt(
    studio.name,
    config.roleType,
    (config.experienceLevel as "entry" | "mid" | "senior" | "lead") ?? "mid",
  );

  return `${base}\n\nStudio context:\n- Name: ${studio.name}\n- Type: ${studio.type}\n- Interview style: ${studio.interviewStyle}\n- Technologies: ${studio.technologies.join(", ") || "TBD"}\n- Key titles: ${studio.games.slice(0, 4).join(", ") || "General game production context"}\n- Remote: ${studio.remoteWork ? "supported" : "primarily on-site"}\n\nConstraints:\n1. Return strict JSON array only.
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
  const parsed = safeParseJSON(raw, [] as JsonArray) as JsonArray;
  const normalized = normalizeQuestions(parsed);
  return normalized;
}

async function generateQuestions(
  config: InterviewConfig,
  studio: StudioContext,
): Promise<InterviewQuestion[]> {
  const aiService = await createAIService();
  const fullPrompt = buildQuestionGenerationPrompt(studio, config);
  const role = config.roleType;
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
      return buildFallbackQuestions(config, studio.name);
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
    config.roleType,
    studio.name,
    persona.name,
    studio.interviewStyle,
    config.focusAreas,
  )}

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

    const parsed = normalizeQuestionFeedback(
      safeParseJSON(response.content, {
        score: Number.NaN,
        feedback: "",
        strengths: [],
        improvements: [],
      }),
    );
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
    config.roleType,
    studio.name,
    persona.name,
    studio.interviewStyle,
    config.focusAreas,
  )}
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
  const parsed = safeParseJSON(raw, {
    overallScore: Number.NaN,
    strengths: [],
    improvements: [],
    recommendations: [],
    feedback: undefined,
  });

  if (!isRecord(parsed)) return null;

  if (typeof parsed.overallScore !== "number") return null;

  return {
    overallScore: normalizeScore(parsed.overallScore),
    strengths: parseStringArray(parsed.strengths),
    improvements: parseStringArray(parsed.improvements),
    recommendations: parseStringArray(parsed.recommendations),
    feedback: typeof parsed.feedback === "string" ? parsed.feedback : undefined,
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
  return normalizeConfig((row.config as InterviewConfigInput) ?? {});
}

async function toInterviewSession(
  row: DBInterviewSession,
  studioContext?: StudioContext,
): Promise<InterviewSession> {
  const config = normalizeSessionConfig(row);
  const studio = studioContext ?? (await resolveStudioContext(row.studioId));
  const questions = normalizeQuestions(row.questions);
  const responses = normalizeResponses(row.responses);

  return {
    id: row.id,
    studioId: row.studioId,
    config,
    questions,
    currentQuestionIndex: Math.min(responses.length, questions.length),
    totalQuestions: questions.length,
    startTime: row.startTime || Date.now(),
    endTime: row.endTime || undefined,
    status: normalizeInterviewSessionStatus(row.status),
    responses,
    finalAnalysis: normalizeFinalAnalysis(row.finalAnalysis) ?? undefined,
    interviewerPersona: buildInterviewerPersona(studio, config),
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
      studioId,
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
      studioId,
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
