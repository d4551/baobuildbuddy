import {
  BYTES_FOUR_KILO,
  BYTES_KILO,
  BYTES_TWO_KILO,
  COUNT_FIVE_HUNDRED,
  COUNT_ONE_THOUSAND,
  RATIO_NINETY_FIVE_HUNDREDTHS,
  RATIO_SEVEN_TENTHS,
  RATIO_THREE_TENTHS,
} from "./numeric";

/** Default temperature for analysis, matching, and structured outputs (lower = more deterministic). */
export const AI_DEFAULT_TEMPERATURE = RATIO_THREE_TENTHS;

/** Default temperature for creative generation (resume, cover letter). */
export const AI_DEFAULT_TEMPERATURE_CREATIVE = RATIO_SEVEN_TENTHS;

/** Default temperature for interview Q&A and feedback (slightly higher than analysis). */
export const AI_DEFAULT_TEMPERATURE_INTERVIEW = 0.35;

/** Default temperature for interview question generation (more varied questions). */
export const AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS = 0.65;

/** Default temperature for structured extraction (field mapping, low variance). */
export const AI_DEFAULT_TEMPERATURE_STRUCTURED = 0.1;

/** AI generation max token limits by use case. Single source of truth. */
export const AI_MAX_TOKENS_CHAT = COUNT_ONE_THOUSAND;
export const AI_MAX_TOKENS_ANALYSIS = 1200;
export const AI_MAX_TOKENS_MATCH = 1500;
export const AI_MAX_TOKENS_RESUME = 1500;
export const AI_MAX_TOKENS_COVER_LETTER = 1200;
export const AI_MAX_TOKENS_WS = BYTES_TWO_KILO;
export const AI_MAX_TOKENS_QUESTION = 900;
export const AI_MAX_TOKENS_FEEDBACK = COUNT_FIVE_HUNDRED;
export const AI_MAX_TOKENS_CV_QUESTION = 1200;
export const AI_MAX_TOKENS_CV_ANALYSIS = 2000;
export const AI_MAX_TOKENS_FIELD_MAPPER = COUNT_ONE_THOUSAND;
export const AI_MAX_TOKENS_SCRAPE_ENRICHMENT = 900;
export const AI_MAX_TOKENS_SCORE = 2000;

/** Default max tokens when a provider call does not specify one. */
export const AI_DEFAULT_MAX_TOKENS = AI_MAX_TOKENS_WS;
/** HuggingFace provider default max tokens (smaller context budget). */
export const AI_DEFAULT_MAX_TOKENS_HUGGINGFACE = BYTES_KILO;
/** Claude provider default max tokens. */
export const AI_DEFAULT_MAX_TOKENS_CLAUDE = BYTES_FOUR_KILO;

/** Default nucleus-sampling top-p for provider requests. */
export const AI_DEFAULT_TOP_P = RATIO_NINETY_FIVE_HUNDREDTHS;
