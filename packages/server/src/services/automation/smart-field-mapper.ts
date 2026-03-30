import { config } from "../../config/env";
import {
  generateFieldAnalysisWithRetry,
  stripToFormElements,
} from "./smart-field-mapper-analysis";
import {
  EMPTY_FIELD_ANALYSIS_RESULT,
  type FieldMapperAIClient,
  type SmartFieldAnalysisContext,
  type SmartFieldAnalysisResult,
} from "./smart-field-mapper-contracts";
import { getCandidateContextSummary } from "./smart-field-mapper-context";
import { fetchPageWithRetry } from "./smart-field-mapper-fetch";

/**
 * AI-powered selector mapper for job-application form fields.
 */
export class SmartFieldMapper {
  /**
   * Analyzes a job page and returns validated selector candidates plus inferred answers.
   */
  async analyze(
    jobUrl: string,
    fieldsNeeded: string[],
    context: SmartFieldAnalysisContext,
    aiService: FieldMapperAIClient,
  ): Promise<SmartFieldAnalysisResult> {
    const uniqueFields = Array.from(
      new Set(fieldsNeeded.map((field) => field.trim()).filter((field) => field.length > 0)),
    );

    if (uniqueFields.length === 0) {
      return EMPTY_FIELD_ANALYSIS_RESULT;
    }

    return fetchPageWithRetry({
      url: jobUrl,
      attemptsRemaining: config.smartFieldMapperRetries,
      delayMs: config.smartFieldMapperRetryDelayMs,
    }).then(
      async (pageResult) => {
        if (!pageResult.ok) {
          return EMPTY_FIELD_ANALYSIS_RESULT;
        }

        const stripped = stripToFormElements(pageResult.html);
        if (stripped.length < 20) {
          return EMPTY_FIELD_ANALYSIS_RESULT;
        }

        return generateFieldAnalysisWithRetry({
          aiService,
          strippedHtml: stripped,
          fieldsNeeded: uniqueFields,
          candidateContext: getCandidateContextSummary(context),
          attemptsRemaining: config.smartFieldMapperRetries,
          delayMs: config.smartFieldMapperRetryDelayMs,
        });
      },
      () => EMPTY_FIELD_ANALYSIS_RESULT,
    );
  }
}

export const smartFieldMapper = new SmartFieldMapper();
export type {
  FieldMapperAIClient,
  SmartFieldAnalysisContext,
  SmartFieldAnalysisResult,
} from "./smart-field-mapper-contracts";
