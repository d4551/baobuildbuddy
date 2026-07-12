import {
  AI_DEFAULT_TEMPERATURE,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  AI_MAX_TOKENS_CV_ANALYSIS,
  AI_MAX_TOKENS_CV_QUESTION,
} from "@bao/shared/constants/ai-generation";
import { API_ERROR_PARSE_RESUME_SYNTHESIS } from "@bao/shared/constants/api-errors";
import type { ResumeData } from "@bao/shared/types/resume";
import { safeParseJson } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { AIService } from "./ai/ai-service";
import { cvQuestionnaireQuestionsPrompt, cvQuestionnaireSynthesizePrompt } from "./ai/prompts-cv";

const JSON_CODE_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/i;
const JSON_ARRAY_PATTERN = /\[[\s\S]*\]/;
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;

export interface CvQuestion {
  id: string;
  question: string;
  category: string;
}

export interface CvQuestionnaireConfig {
  targetRole: string;
  studioName?: string;
  experienceLevel?: string;
}

const isCvQuestion = (value: unknown): value is CvQuestion =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.question === "string" &&
  typeof value.category === "string";

async function getAIService(): Promise<AIService> {
  const rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return AIService.fromSettings(rows[0]);
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }
  const codeFence = text.match(JSON_CODE_FENCE_PATTERN);
  if (codeFence?.[1]) return codeFence[1].trim();
  const objectMatch = text.match(JSON_OBJECT_PATTERN);
  if (objectMatch) return objectMatch[0];
  const arrayMatch = text.match(JSON_ARRAY_PATTERN);
  if (arrayMatch) return arrayMatch[0];
  return trimmed;
}

export class CvQuestionnaireService {
  async generateQuestions(config: CvQuestionnaireConfig): Promise<CvQuestion[]> {
    const ai = await getAIService();
    const prompt = cvQuestionnaireQuestionsPrompt(
      config.targetRole,
      config.studioName,
      config.experienceLevel,
    );

    const response = await ai.generate(prompt, {
      purpose: "resume",
      temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: AI_MAX_TOKENS_CV_QUESTION,
    });
    if (response.error) {
      throw new Error(response.error);
    }

    const raw = safeParseJson(extractJson(response.content));
    if (!Array.isArray(raw)) {
      return [];
    }

    const questions: CvQuestion[] = [];
    for (const candidate of raw) {
      if (!isCvQuestion(candidate)) {
        continue;
      }
      questions.push({
        id: candidate.id,
        question: candidate.question,
        category: candidate.category,
      });
    }
    return questions;
  }

  async synthesizeResume(
    questionsAndAnswers: Array<{ id: string; question: string; answer: string; category: string }>,
  ): Promise<Partial<ResumeData>> {
    const ai = await getAIService();
    const prompt = cvQuestionnaireSynthesizePrompt(questionsAndAnswers);

    const response = await ai.generate(prompt, {
      purpose: "resume",
      temperature: AI_DEFAULT_TEMPERATURE,
      maxTokens: AI_MAX_TOKENS_CV_ANALYSIS,
    });
    if (response.error) {
      throw new Error(response.error);
    }

    const parsed = safeParseJson(extractJson(response.content));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(API_ERROR_PARSE_RESUME_SYNTHESIS);
    }
    return parsed satisfies Partial<ResumeData>;
  }
}

export const cvQuestionnaireService = new CvQuestionnaireService();
