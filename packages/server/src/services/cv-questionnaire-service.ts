import type { ResumeData } from "@navi/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { AIService } from "./ai/ai-service";
import {
  cvQuestionnaireQuestionsPrompt,
  cvQuestionnaireSynthesizePrompt,
} from "./ai/prompts";

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

async function getAIService(): Promise<AIService> {
  const rows = await db.select().from(settings).where(eq(settings.id, "default"));
  return AIService.fromSettings(rows[0]);
}

function extractJson(text: string): string {
  const codeFence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFence?.[1]) return codeFence[1].trim();
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];
  const objectMatch = text.match(/\{[\s\S]*\}/);
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

    try {
      const raw = JSON.parse(extractJson(response.content));
      if (!Array.isArray(raw)) return [];

      return raw
        .filter(
          (q: unknown): q is { id: string; question: string; category: string } =>
            typeof q === "object" &&
            q !== null &&
            typeof (q as { id?: unknown }).id === "string" &&
            typeof (q as { question?: unknown }).question === "string" &&
            typeof (q as { category?: unknown }).category === "string",
        )
        .map((q) => ({
          id: q.id,
          question: q.question,
          category: q.category,
        }));
    } catch {
      return [];
    }
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

    try {
      const parsed = JSON.parse(extractJson(response.content)) as Partial<ResumeData>;
      return parsed;
    } catch {
      throw new Error("Failed to parse AI resume synthesis");
    }
  }
}

export const cvQuestionnaireService = new CvQuestionnaireService();
