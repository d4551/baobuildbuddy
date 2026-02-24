import type { ResumeData } from "@bao/shared";
import { isRecord, safeParseJson } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { AIService } from "./ai/ai-service";
import { cvQuestionnaireQuestionsPrompt, cvQuestionnaireSynthesizePrompt } from "./ai/prompts";

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
  const codeFence = text.match(JSON_CODE_FENCE_PATTERN);
  if (codeFence?.[1]) return codeFence[1].trim();
  const arrayMatch = text.match(JSON_ARRAY_PATTERN);
  if (arrayMatch) return arrayMatch[0];
  const objectMatch = text.match(JSON_OBJECT_PATTERN);
  if (objectMatch) return objectMatch[0];
  return text.trim();
}

export class CvQuestionnaireService {
  async generateQuestions(config: CvQuestionnaireConfig): Promise<CvQuestion[]> {
    const ai = await getAIService();
    const prompt = cvQuestionnaireQuestionsPrompt(
      config.targetRole,
      config.studioName,
      config.experienceLevel,
    );

    const response = await ai.generate(prompt, { temperature: 0.7, maxTokens: 1200 });
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

    const response = await ai.generate(prompt, { temperature: 0.3, maxTokens: 2000 });
    if (response.error) {
      throw new Error(response.error);
    }

    const parsed = safeParseJson(extractJson(response.content));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Failed to parse AI resume synthesis");
    }
    return parsed as Partial<ResumeData>;
  }
}

export const cvQuestionnaireService = new CvQuestionnaireService();
