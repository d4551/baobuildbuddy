import {
  AI_PROVIDER_DEFAULT,
  type AIProviderType,
  JOB_EXPERIENCE_LEVELS,
  JOB_TYPES,
  RESUME_TEMPLATE_DEFAULT,
  RESUME_TEMPLATE_OPTIONS,
  type JobExperienceLevel,
  type JobType,
  type ResumeEducationItem,
  type ResumeExperienceItem,
  type ResumeProject,
  type ResumeTemplate,
  type StudioCulture,
} from "@bao/shared";

export const AI_PROVIDERS: readonly AIProviderType[] = [
  "local",
  "gemini",
  "claude",
  "openai",
  "huggingface",
];

export const AI_PROVIDER_DIAGNOSTIC_CODES = [
  "healthy",
  "unconfigured",
  "unreachable",
  "empty-model-list",
  "invalid-model",
  "timeout",
  "error",
] as const;

export const isOneOf = <T extends string>(value: unknown, choices: readonly T[]): value is T =>
  typeof value === "string" && choices.some((choice) => choice === value);

export const asEnum = <T extends string>(value: unknown, choices: readonly T[]): T | undefined =>
  isOneOf(value, choices) ? value : undefined;

export const asEnumArray = <T extends string>(value: unknown, choices: readonly T[]): T[] =>
  Array.isArray(value) ? value.filter((entry): entry is T => isOneOf(entry, choices)) : [];

export const normalizeResumeTemplate = (value: unknown): ResumeTemplate =>
  asEnum(value, RESUME_TEMPLATE_OPTIONS) ?? RESUME_TEMPLATE_DEFAULT;

export const normalizeJobExperienceLevel = (value: unknown): JobExperienceLevel | undefined =>
  asEnum(value, JOB_EXPERIENCE_LEVELS);

export const normalizeJobType = (value: unknown): JobType =>
  asEnum(value, JOB_TYPES) ?? "full-time";

export const normalizeAIProvider = (value: unknown): AIProviderType =>
  asEnum(value, AI_PROVIDERS) ?? AI_PROVIDER_DEFAULT;

export const isProviderId = (value: string): value is AIProviderType =>
  isOneOf(value, AI_PROVIDERS);

export const normalizeProviderDiagnosticCode = (value: unknown) =>
  asEnum(value, AI_PROVIDER_DIAGNOSTIC_CODES) ?? "error";

export const normalizeStudioCulture = (
  value: unknown,
  helpers: {
    isRecord: (value: unknown) => value is Record<string, unknown>;
    asString: (value: unknown) => string | undefined;
    asStringArray: (value: unknown) => string[];
  },
): StudioCulture => {
  if (!helpers.isRecord(value)) {
    return {
      values: [],
      workStyle: "",
    };
  }
  return {
    values: helpers.asStringArray(value.values),
    workStyle: helpers.asString(value.workStyle) ?? "",
    environment: helpers.asString(value.environment),
  };
};

export const toResumeCollection = <T>(
  value: unknown,
  normalizer: (entry: unknown) => T | null,
): T[] =>
  Array.isArray(value) ? value.map(normalizer).filter((entry): entry is T => entry !== null) : [];

export type ResumeItemNormalizers = {
  ResumeExperienceItem: ResumeExperienceItem;
  ResumeEducationItem: ResumeEducationItem;
  ResumeProject: ResumeProject;
};
