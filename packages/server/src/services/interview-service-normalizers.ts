import type {
  InterviewAnalysis,
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
} from "@bao/shared/types/interview";
import { normalizeConfig } from "./interview-service-config-normalizers";
import type { DBInterviewSession } from "./interview-service-contracts";
import { isRecord, parseNumber, parseStringArray } from "./interview-service-value-parsers";
import { PERCENT_MAX } from "@bao/shared/constants/numeric";
const NUM_30 = 30;
const NUM_300 = 300;
const NUM_90 = 90;

const questionTypePattern = new Set<string>([
  "behavioral",
  "technical",
  "studio-specific",
  "intro",
  "closing",
]);

const difficultyPattern = new Set<string>(["easy", "medium", "hard"]);

export function normalizeQuestionType(
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

export function normalizeDifficulty(value: unknown): InterviewQuestion["difficulty"] {
  if (typeof value !== "string" || !difficultyPattern.has(value)) {
    return "medium";
  }
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  return "medium";
}

export function normalizeQuestions(raw: unknown): InterviewQuestion[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
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
        expectedDuration: parseNumber(value.expectedDuration, NUM_90, NUM_30, NUM_300),
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

export function normalizeAiAnalysisScore(scoreCandidate: unknown): number {
  if (typeof scoreCandidate === "number" && Number.isFinite(scoreCandidate)) {
    return normalizeScore(Math.round(scoreCandidate));
  }
  return 0;
}

export function normalizeResponses(raw: unknown): InterviewResponse[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const parsed: InterviewResponse[] = [];

  for (const value of raw) {
    if (!isRecord(value)) {
      continue;
    }

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

export function normalizeFinalAnalysis(raw: unknown): InterviewAnalysis | null {
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
  };
}

export function normalizeInterviewSessionStatus(value: unknown): InterviewSession["status"] {
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

export function normalizeSessionConfig(row: DBInterviewSession): InterviewConfig {
  return normalizeConfig(isRecord(row.config) ? row.config : {});
}
