import type { AutofillAnalysisOptions } from "./automation-service-contracts";
import { type SmartFieldAnalysisResult } from "./smart-field-mapper";
export declare const SMART_FIELD_CORE_KEYS: readonly ["fullName", "email", "phone", "resume", "coverLetter", "submit"];
export declare const normalizeGeneratedFieldAnswers: (fieldAnswers: Record<string, string>) => Record<string, string>;
export declare const resolveAutofillAnalysis: (options: AutofillAnalysisOptions) => Promise<SmartFieldAnalysisResult>;
