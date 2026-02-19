import {
  type InterviewAnalysis,
  type InterviewConfig,
  type InterviewQuestion,
  type InterviewResponse,
  type InterviewSession,
  type InterviewerPersona,
  generateId,
} from "@navi/shared";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { interviewSessions } from "../db/schema/interviews";
import { settings } from "../db/schema/settings";
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

type LegacyQuestionType = "behavioral" | "technical" | "studio-specific" | "intro" | "closing";
type LegacyDifficulty = "easy" | "medium" | "hard";

const DEFAULT_FOCUS_AREAS = ["architecture", "collaboration", "problem-solving"];
const MAX_QUESTION_COUNT = 12;
const FALLBACK_INTERVIEW_LEVEL = "mid-level";

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

const questionTypePattern = new Set<InterviewQuestion["type"]>([
  "behavioral",
  "technical",
  "studio-specific",
  "intro",
  "closing",
]);

const difficultyPattern = new Set<InterviewQuestion["difficulty"]>(["easy", "medium", "hard"]);

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
    (entry): entry is string => typeof entry === "string" && entry.trim(),
  );
  return strings.map((entry) => entry.trim());
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
  const voiceSettings = raw.voiceSettings && typeof raw.voiceSettings === "object"
    ? (raw.voiceSettings as { voiceId?: string; rate?: number; pitch?: number; volume?: number; language?: string })
    : undefined;

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
  return typeof value === "string" && questionTypePattern.has(value as LegacyQuestionType)
    ? (value as InterviewQuestion["type"])
    : fallback;
}

/**
 * Restore known interview difficulty values from unknown payload.
 */
function normalizeDifficulty(value: unknown): InterviewQuestion["difficulty"] {
  return typeof value === "string" && difficultyPattern.has(value as LegacyDifficulty)
    ? (value as InterviewQuestion["difficulty"])
    : "medium";
}

function normalizeQuestions(raw: unknown): InterviewQuestion[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((value, index): InterviewQuestion | null => {
      if (!value || typeof value !== "object") return null;
      const candidate = value as Partial<InterviewQuestion> & Record<string, unknown>;

      const rawId = candidate.id;
      const id =
        typeof rawId === "string"
          ? rawId.trim() || `generated-${index + 1}`
          : `generated-${Number(rawId) || index + 1}`;
      const followUps = Array.isArray(candidate.followUps)
        ? candidate.followUps
        : [];
      if (typeof candidate.question !== "string" || !candidate.question.trim()) {
        return null;
      }

      return {
        id,
        type: normalizeQuestionType(candidate.type, "behavioral"),
        question: candidate.question.trim(),
        followUps: parseStringArray(followUps),
        expectedDuration: parseNumber(candidate.expectedDuration, 90, 30, 300),
        difficulty: normalizeDifficulty(candidate.difficulty),
        tags: parseStringArray(candidate.tags),
      };
    })
    .filter((entry): entry is InterviewQuestion => entry !== null);
}

function normalizeResponses(raw: unknown): InterviewResponse[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const response = value as Partial<InterviewResponse> & { aiAnalysis?: unknown };

      if (
        typeof response.questionId !== "string" ||
        typeof response.transcript !== "string" ||
        typeof response.duration !== "number" ||
        typeof response.timestamp !== "number" ||
        typeof response.confidence !== "number"
      ) {
        return null;
      }

      return {
        questionId: response.questionId,
        transcript: response.transcript,
        duration: response.duration,
        timestamp: response.timestamp,
        confidence: response.confidence,
        aiAnalysis:
          response.aiAnalysis &&
          typeof response.aiAnalysis === "object" &&
          response.aiAnalysis !== null
            ? {
                score:
                  typeof (response.aiAnalysis as { score?: unknown }).score === "number"
                    ? normalizeScore((response.aiAnalysis as { score?: unknown }).score)
                    : 0,
                feedback:
                  typeof (response.aiAnalysis as { feedback?: unknown }).feedback === "string"
                    ? String((response.aiAnalysis as { feedback?: unknown }).feedback)
                    : "",
                strengths: parseStringArray(
                  (response.aiAnalysis as { strengths?: unknown }).strengths,
                ),
                improvements: parseStringArray(
                  (response.aiAnalysis as { improvements?: unknown }).improvements,
                ),
              }
            : undefined,
      };
    })
    .filter((entry): entry is InterviewResponse => entry !== null);
}

function normalizeFinalAnalysis(raw: unknown): InterviewAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<InterviewAnalysis> & { feedback?: unknown };

  if (typeof candidate.overallScore !== "number") {
    return null;
  }

  return {
    overallScore: normalizeScore(candidate.overallScore),
    strengths: parseStringArray(candidate.strengths),
    improvements: parseStringArray(candidate.improvements),
    recommendations: parseStringArray(candidate.recommendations),
    feedback: typeof candidate.feedback === "string" ? candidate.feedback : undefined,
  };
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
    culture:
      studio.culture && typeof studio.culture === "object"
        ? (studio.culture as Record<string, unknown>)
        : {},
    location: studio.location,
    type: studio.type ?? FALLBACK_STUDIO_CONTEXT.type,
    remoteWork: studio.remoteWork === true,
  };
}

async function createAIService(): Promise<AIService> {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, "default"));
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
    const response = await aiService.generate(prompt, { temperature: 0.65, maxTokens: 1200 });
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
    try {
      return await tryGenerate(buildSimpleQuestionPrompt(role, level, config.questionCount));
    } catch {
      throw new Error(
        `Technical difficulty generating questions. Please try again. (${firstErr instanceof Error ? firstErr.message : "Unknown error"})`,
      );
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
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<{
    score: unknown;
    feedback: unknown;
    strengths: unknown;
    improvements: unknown;
  }>;
  const parsedScore =
    typeof candidate.score === "number"
      ? candidate.score
      : Number.parseInt(String(candidate.score || ""), 10);
  if (!Number.isFinite(parsedScore)) return null;

  return {
    score: normalizeScore(parsedScore),
    feedback:
      typeof candidate.feedback === "string" && candidate.feedback.trim()
        ? candidate.feedback.trim()
        : "",
    strengths: parseStringArray(candidate.strengths),
    improvements: parseStringArray(candidate.improvements),
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
    const response = await aiService.generate(prompt, {
      temperature: 0.35,
      maxTokens: 500,
    });
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

  if (!parsed || typeof parsed !== "object") return null;
  const candidate = parsed as {
    overallScore?: unknown;
    strengths?: unknown;
    improvements?: unknown;
    recommendations?: unknown;
    feedback?: unknown;
  };

  if (typeof candidate.overallScore !== "number") return null;

  return {
    overallScore: normalizeScore(candidate.overallScore),
    strengths: parseStringArray(candidate.strengths),
    improvements: parseStringArray(candidate.improvements),
    recommendations: parseStringArray(candidate.recommendations),
    feedback: typeof candidate.feedback === "string" ? candidate.feedback : undefined,
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
    const response = await aiService.generate(prompt, {
      temperature: 0.35,
      maxTokens: 900,
    });

    if (!response.error) {
      const parsed = normalizeFinalFromAI(response.content);
      if (parsed) return parsed;
    }
  } catch {
    // Ignore and use fallback path.
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
    status: (row.status as InterviewSession["status"]) || "active",
    responses,
    finalAnalysis: normalizeFinalAnalysis(row.finalAnalysis),
    interviewerPersona: buildInterviewerPersona(studio, config),
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
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

    await db.insert(interviewSessions).values({
      id,
      studioId,
      config,
      questions: questionSet,
      responses: [],
      finalAnalysis: undefined,
      status: "active",
      startTime: now,
      endTime: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const row: DBInterviewSession = {
      id,
      studioId,
      config,
      questions: questionSet,
      responses: [],
      finalAnalysis: undefined,
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
    const status = responses.length >= questions.length ? "completed" : "in-progress";
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
      await db
        .update(interviewSessions)
        .set({
          finalAnalysis,
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

    const now = new Date().toISOString();
    await db
      .update(interviewSessions)
      .set({
        status: "completed",
        endTime: Date.now(),
        finalAnalysis,
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
