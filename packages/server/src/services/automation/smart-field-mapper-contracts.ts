import type { AIResponse } from "@bao/shared";
import {
  AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH,
  AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  SCHEMA_MAX_ITEMS_SMALL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared";
import { z } from "zod";

export interface FieldMapperAIClient {
  generate: (
    prompt: string,
    options?: { purpose?: "automationFieldMapping"; temperature?: number; maxTokens?: number },
  ) => Promise<AIResponse>;
}

export interface SmartFieldAnalysisContext {
  readonly resume: Record<string, unknown>;
  readonly coverLetter?: Record<string, unknown> | null;
  readonly existingAnswers?: Record<string, string>;
}

export interface SmartFieldAnalysisResult {
  readonly selectorMap: Record<string, string[]>;
  readonly fieldAnswers: Record<string, string>;
}

export type FetchPageResult =
  | {
      ok: true;
      html: string;
    }
  | {
      ok: false;
      statusCode?: number;
      message: string;
    };

export const selectorMapSchema = z.record(
  z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_URL)).min(1).max(SCHEMA_MAX_ITEMS_SMALL),
);

export const fieldAnswersSchema = z.record(
  z.string().trim().min(1).max(AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH),
  z.string().trim().max(AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH),
);

export const fieldAnalysisSchema = z.object({
  selectorMap: selectorMapSchema.default({}),
  fieldAnswers: fieldAnswersSchema.default({}),
});

export const EMPTY_FIELD_ANALYSIS_RESULT = {
  selectorMap: {},
  fieldAnswers: {},
} satisfies SmartFieldAnalysisResult;
