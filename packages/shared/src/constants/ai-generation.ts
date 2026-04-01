/** Default temperature for analysis, matching, and structured outputs (lower = more deterministic). */
export const AI_DEFAULT_TEMPERATURE = 0.3;

/** Default temperature for creative generation (resume, cover letter). */
export const AI_DEFAULT_TEMPERATURE_CREATIVE = 0.7;

/** Default temperature for interview Q&A and feedback (slightly higher than analysis). */
export const AI_DEFAULT_TEMPERATURE_INTERVIEW = 0.35;

/** Default temperature for interview question generation (more varied questions). */
export const AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS = 0.65;

/** Default temperature for structured extraction (field mapping, low variance). */
export const AI_DEFAULT_TEMPERATURE_STRUCTURED = 0.1;

/** AI generation max token limits by use case. Single source of truth. */
export const AI_MAX_TOKENS_CHAT = 1000;
export const AI_MAX_TOKENS_ANALYSIS = 1200;
export const AI_MAX_TOKENS_MATCH = 1500;
export const AI_MAX_TOKENS_RESUME = 1500;
export const AI_MAX_TOKENS_COVER_LETTER = 1200;
export const AI_MAX_TOKENS_WS = 2048;
export const AI_MAX_TOKENS_QUESTION = 900;
export const AI_MAX_TOKENS_FEEDBACK = 500;
export const AI_MAX_TOKENS_CV_QUESTION = 1200;
export const AI_MAX_TOKENS_CV_ANALYSIS = 2000;
export const AI_MAX_TOKENS_FIELD_MAPPER = 1000;
export const AI_MAX_TOKENS_SCRAPE_ENRICHMENT = 900;
export const AI_MAX_TOKENS_SCORE = 2000;
