import { AI_DEFAULT_TEMPERATURE_STRUCTURED, AI_MAX_TOKENS_FIELD_MAPPER } from "@bao/shared/constants/ai-generation";
import { safeParseJson } from "@bao/shared/utils/json";
import { config } from "../../config/env";
import { formFieldAnalysisPrompt } from "../ai/prompts-automation";
import {
  EMPTY_FIELD_ANALYSIS_RESULT,
  fieldAnalysisSchema,
  selectorMapSchema,
  type FieldMapperAIClient,
  type SmartFieldAnalysisResult,
} from "./smart-field-mapper-contracts";
import { wait } from "./smart-field-mapper-fetch";

const parseFieldAnalysisResponse = (content: string): SmartFieldAnalysisResult => {
  const cleaned = content
    .replace(/```json\n?/gu, "")
    .replace(/```\n?/gu, "")
    .trim();
  const parsedValue = safeParseJson(cleaned);
  const parsedAnalysis = fieldAnalysisSchema.safeParse(parsedValue);
  if (parsedAnalysis.success) {
    return parsedAnalysis.data;
  }

  const parsedSelectors = selectorMapSchema.safeParse(parsedValue);
  if (parsedSelectors.success) {
    return {
      selectorMap: parsedSelectors.data,
      fieldAnswers: {},
    };
  }

  return EMPTY_FIELD_ANALYSIS_RESULT;
};

export const stripToFormElements = (html: string): string => {
  const formElementRegex =
    /<(?:form|input|textarea|select|option|label|button|fieldset|legend)\b[^>]*(?:\/>|>(?:[\s\S]*?)<\/(?:form|input|textarea|select|option|label|button|fieldset|legend)>|>)/giu;

  const matches = html.match(formElementRegex);
  if (!matches) {
    return "";
  }

  let result = "";
  for (const match of matches) {
    if (result.length + match.length > config.smartFieldMapperMaxFormHtmlChars) {
      break;
    }
    result += `${match}\n`;
  }

  return result.trim();
};

export const generateFieldAnalysisWithRetry = (params: {
  aiService: FieldMapperAIClient;
  strippedHtml: string;
  fieldsNeeded: string[];
  candidateContext: string;
  attemptsRemaining: number;
  delayMs: number;
}): Promise<SmartFieldAnalysisResult> => {
  const prompt = formFieldAnalysisPrompt(
    params.strippedHtml,
    params.fieldsNeeded,
    params.candidateContext,
  );

  return params.aiService
    .generate(prompt, {
      purpose: "automationFieldMapping",
      temperature: AI_DEFAULT_TEMPERATURE_STRUCTURED,
      maxTokens: AI_MAX_TOKENS_FIELD_MAPPER,
    })
    .then(
      async (response) => {
        if (response.error || !response.content) {
          if (params.attemptsRemaining > 1) {
            await wait(params.delayMs);
            return generateFieldAnalysisWithRetry({
              ...params,
              attemptsRemaining: params.attemptsRemaining - 1,
              delayMs: params.delayMs * 2,
            });
          }
          return EMPTY_FIELD_ANALYSIS_RESULT;
        }

        const parsedAnalysis = parseFieldAnalysisResponse(response.content);
        if (
          Object.keys(parsedAnalysis.selectorMap).length > 0 ||
          Object.keys(parsedAnalysis.fieldAnswers).length > 0
        ) {
          return parsedAnalysis;
        }

        if (params.attemptsRemaining > 1) {
          await wait(params.delayMs);
          return generateFieldAnalysisWithRetry({
            ...params,
            attemptsRemaining: params.attemptsRemaining - 1,
            delayMs: params.delayMs * 2,
          });
        }

        return EMPTY_FIELD_ANALYSIS_RESULT;
      },
      async () => {
        if (params.attemptsRemaining > 1) {
          await wait(params.delayMs);
          return generateFieldAnalysisWithRetry({
            ...params,
            attemptsRemaining: params.attemptsRemaining - 1,
            delayMs: params.delayMs * 2,
          });
        }
        return EMPTY_FIELD_ANALYSIS_RESULT;
      },
    );
};
