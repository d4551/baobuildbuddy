import { createServerLogger } from "../../utils/logger";
import {
  type SmartFieldAnalysisContext,
  type SmartFieldAnalysisResult,
  smartFieldMapper,
} from "./smart-field-mapper";
import { tryLoadAIService } from "./automation-settings-support";
import type { AutofillAnalysisOptions } from "./automation-service-contracts";

const automationPreparationLogger = createServerLogger("automation-job-apply-preparation");

export const SMART_FIELD_CORE_KEYS = [
  "fullName",
  "email",
  "phone",
  "resume",
  "coverLetter",
  "submit",
] as const;

export const normalizeGeneratedFieldAnswers = (
  fieldAnswers: Record<string, string>,
): Record<string, string> => {
  const reservedFieldKeys = new Set<string>(SMART_FIELD_CORE_KEYS);
  const normalizedAnswers: Record<string, string> = {};

  for (const [key, value] of Object.entries(fieldAnswers)) {
    const normalizedKey = key.trim();
    const normalizedValue = value.trim();
    if (
      normalizedKey.length === 0 ||
      normalizedValue.length === 0 ||
      reservedFieldKeys.has(normalizedKey)
    ) {
      continue;
    }

    normalizedAnswers[normalizedKey] = normalizedValue;
  }

  return normalizedAnswers;
};

const createEmptyAutofillAnalysis = (): SmartFieldAnalysisResult => ({
  selectorMap: {},
  fieldAnswers: {},
});

const buildSmartFieldAnalysisContext = (
  options: Pick<AutofillAnalysisOptions, "resume" | "coverLetter" | "existingAnswers">,
): SmartFieldAnalysisContext => ({
  resume: Object.fromEntries(Object.entries(options.resume)),
  coverLetter: options.coverLetter ? { content: options.coverLetter.content || {} } : null,
  existingAnswers: options.existingAnswers,
});

export const resolveAutofillAnalysis = async (
  options: AutofillAnalysisOptions,
): Promise<SmartFieldAnalysisResult> => {
  if (!options.automationSettings.enableSmartSelectors) {
    automationPreparationLogger.debug("Smart field mapping skipped: enableSmartSelectors is off");
    return createEmptyAutofillAnalysis();
  }

  const aiService = await tryLoadAIService();
  if (!aiService) {
    automationPreparationLogger.debug("Smart field mapping skipped: AI service unavailable");
    return createEmptyAutofillAnalysis();
  }

  const result = await smartFieldMapper.analyze(
    options.jobUrl,
    [...SMART_FIELD_CORE_KEYS],
    buildSmartFieldAnalysisContext(options),
    aiService,
  );
  const isEmpty =
    Object.keys(result.selectorMap).length === 0 && Object.keys(result.fieldAnswers).length === 0;
  if (isEmpty) {
    automationPreparationLogger.debug("Smart field mapping returned empty result", {
      jobUrl: options.jobUrl,
    });
  }
  return result;
};
