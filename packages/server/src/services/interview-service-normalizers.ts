import {
  COUNT_NINETY,
  COUNT_THIRTY,
  COUNT_THREE_HUNDRED,
  PERCENT_MAX,
} from "@bao/shared/constants/numeric";
import { resolveInterviewAnalysisSource } from "@bao/shared/utils/interview-analysis-provenance";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import type {
  InterviewAnalysis,
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
} from "@bao/shared/types/interview";
import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import { normalizeConfig } from "./interview-service-config-normalizers";
import type { DBInterviewSession } from "./interview-service-contracts";
import { parseNumber, parseStringArray } from "./interview-service-value-parsers";

const questionTypePattern = new Set<string>([
  "behavioral",
  "technical",
  "studio-specific",
  "intro",
  "closing",
]);

const difficultyPattern = new Set<string>(["easy", "medium", "hard"]);

const isQuestionType = (value: string): value is InterviewQuestion["type"] =>
  questionTypePattern.has(value);

const isDifficulty = (value: string): value is InterviewQuestion["difficulty"] =>
  difficultyPattern.has(value);

export function normalizeQuestionType<T>(
  value: T,
  fallback: InterviewQuestion["type"],
): InterviewQuestion["type"] {
  if (typeof value === "string" && isQuestionType(value)) {
    return value;
  }
  return fallback;
}

export function normalizeDifficulty<T>(value: T): InterviewQuestion["difficulty"] {
  if (typeof value === "string" && isDifficulty(value)) {
    return value;
  }
  return "medium";
}

export function normalizeQuestions<T>(raw: T): InterviewQuestion[] {
  const entries = asJsonArray(raw);
  if (!entries) {
    return [];
  }

  return entries
    .map((value, index): InterviewQuestion | null => {
      if (!isRecord(value)) {
        return null;
      }

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
        expectedDuration: parseNumber(
          value.expectedDuration,
          COUNT_NINETY,
          COUNT_THIRTY,
          COUNT_THREE_HUNDRED,
        ),
        difficulty: normalizeDifficulty(value.difficulty),
        tags: parseStringArray(value.tags),
      };
    })
    .filter((entry): entry is InterviewQuestion => entry !== null);
}

export function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(PERCENT_MAX, Math.round(value)));
}

export function normalizeAiAnalysisScore<T>(scoreCandidate: T): number {
  if (typeof scoreCandidate === "number" && Number.isFinite(scoreCandidate)) {
    return normalizeScore(Math.round(scoreCandidate));
  }
  return 0;
}

/** Shape a persisted response row must satisfy before it is trusted. */
interface PersistedResponseFields {
  readonly questionId: string;
  readonly transcript: string;
  readonly duration: number;
  readonly timestamp: number;
  readonly confidence: number;
}

const toPersistedResponseFields = (value: JsonObject): PersistedResponseFields | null =>
  typeof value.questionId === "string" &&
  typeof value.transcript === "string" &&
  typeof value.duration === "number" &&
  typeof value.timestamp === "number" &&
  typeof value.confidence === "number"
    ? {
        questionId: value.questionId,
        transcript: value.transcript,
        duration: value.duration,
        timestamp: value.timestamp,
        confidence: value.confidence,
      }
    : null;

const toPersistedAiAnalysis = (
  raw: JsonValue | undefined,
): NonNullable<InterviewResponse["aiAnalysis"]> | null => {
  if (!isRecord(raw)) {
    return null;
  }
  return {
    score: normalizeAiAnalysisScore(raw.score),
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    strengths: parseStringArray(raw.strengths),
    improvements: parseStringArray(raw.improvements),
    source: resolveInterviewAnalysisSource(raw.source),
    ...(typeof raw.provider === "string" ? { provider: raw.provider } : {}),
    ...(typeof raw.model === "string" ? { model: raw.model } : {}),
  };
};

export function normalizeResponses<T>(raw: T): InterviewResponse[] {
  const entries = asJsonArray(raw);
  if (!entries) {
    return [];
  }

  const parsed: InterviewResponse[] = [];
  for (const value of entries) {
    if (!isRecord(value)) {
      continue;
    }
    const fields = toPersistedResponseFields(value);
    if (!fields) {
      continue;
    }
    const aiAnalysis = toPersistedAiAnalysis(value.aiAnalysis);
    parsed.push({ ...fields, ...(aiAnalysis ? { aiAnalysis } : {}) });
  }

  return parsed;
}

export function normalizeFinalAnalysis<T>(raw: T): InterviewAnalysis | null {
  if (!isRecord(raw)) {
    return null;
  }
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
    ...normalizePersistedProvenance(raw),
  };
}

function normalizePersistedProvenance(
  raw: JsonObject,
): Pick<InterviewAnalysis, "analysisSource" | "aiAverageScore" | "provenanceCounts"> {
  const source = raw.analysisSource;
  const counts = raw.provenanceCounts;
  return {
    ...(source === "ai" || source === "heuristic" || source === "mixed" || source === "unknown"
      ? { analysisSource: source }
      : {}),
    ...(typeof raw.aiAverageScore === "number" || raw.aiAverageScore === null
      ? { aiAverageScore: raw.aiAverageScore }
      : {}),
    ...(isRecord(counts) &&
    typeof counts.ai === "number" &&
    typeof counts.heuristic === "number" &&
    typeof counts.unknown === "number"
      ? {
          provenanceCounts: {
            ai: counts.ai,
            heuristic: counts.heuristic,
            unknown: counts.unknown,
          },
        }
      : {}),
  };
}

const isSessionStatus = (value: string): value is InterviewSession["status"] =>
  value === "preparing" ||
  value === "active" ||
  value === "paused" ||
  value === "completed" ||
  value === "cancelled";

export function normalizeInterviewSessionStatus<T>(value: T): InterviewSession["status"] {
  if (typeof value === "string" && isSessionStatus(value)) {
    return value;
  }
  return "active";
}

export function normalizeSessionConfig(row: DBInterviewSession): InterviewConfig {
  return normalizeConfig(isRecord(row.config) ? row.config : {});
}
