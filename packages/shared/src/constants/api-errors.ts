/**
 * Canonical API error messages used across server routes.
 * Single source of truth for user-facing error strings.
 */
export const API_ERROR_UNKNOWN = "Unknown error";
export const API_ERROR_SCRAPE_STUDIOS_FAILED = "Studio scrape failed";
export const API_ERROR_SCRAPE_JOBS_FAILED = "Job scrape failed";
export const API_ERROR_AUTOMATION_PROCESS_FAILED = "Failed to process automation request";
export const API_ERROR_AUTOMATION_START_FAILED = "Failed to start automation";
export const API_ERROR_GENERATE_QUESTIONS = "Failed to generate questions";
export const API_ERROR_SYNTHESIZE_RESUME = "Failed to synthesize resume";
export const API_ERROR_EXPORT_RESUME = "Failed to export resume";
export const API_ERROR_EXPORT_PORTFOLIO = "Failed to export portfolio";
export const API_ERROR_EXPORT_COVER_LETTER = "Failed to export cover letter";
export const API_ERROR_LOAD_SETTINGS = "Failed to load settings";
export const API_ERROR_INIT_SETTINGS_ROW = "Failed to initialize settings row";
export const API_ERROR_INVALID_AUTOMATION_CONFIG =
  "Invalid settings.automationSettings configuration";
export const API_ERROR_INVALID_AUTOMATION_PAYLOAD = "Invalid automationSettings payload";
export const API_ERROR_UNKNOWN_PROVIDER = "Unknown provider";
export const API_ERROR_INVALID_RUN_ID = "Invalid run ID format";
export const API_ERROR_INVALID_SCREENSHOT_INDEX = "Invalid screenshot index format";
export const API_ERROR_INVALID_SCREENSHOT_METADATA = "Invalid screenshot file metadata";
export const API_ERROR_ANALYZE_RESUME = "Failed to analyze resume";
export const API_ERROR_GENERATE_COVER_LETTER = "Failed to generate cover letter";
export const API_ERROR_MATCH_JOBS = "Failed to match jobs";
export const API_ERROR_GENERATE_AI_RESPONSE = "Failed to generate AI response";
export const API_ERROR_START_INTERVIEW = "Failed to start interview session";
export const API_ERROR_GENERATE_RESPONSE = "Failed to generate response";
export const API_ERROR_GENERATE_EMAIL_RESPONSE = "Failed to generate email response";
export const API_ERROR_EMAIL_DELIVERY_FAILED = "Failed to deliver email response";
export const API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING = "Email delivery settings are incomplete";
export const API_ERROR_INVALID_SCRAPER_JSON = "Scraper script returned invalid JSON";
export const API_ERROR_INVALID_SCRIPT_ID = "Invalid automation script ID";
export const API_ERROR_AI_SCORING_FAILED = "AI scoring failed";
export const API_ERROR_AI_ENHANCEMENT_FAILED = "AI enhancement failed";
export const API_ERROR_RESUME_NOT_FOUND = "Resume not found";
export const API_ERROR_JOB_NOT_FOUND = "Job not found";
export const API_ERROR_NOT_FOUND = "Not found";
export const API_ERROR_AUTOMATION_RUN_NOT_FOUND = "Automation run was created but not found";
export const API_ERROR_SCHEDULED_RUN_NOT_FOUND = "Scheduled automation run not found";
export const API_ERROR_RUN_NOT_FOUND = "Run not found";
export const API_ERROR_SKILL_MAPPING_NOT_FOUND = "Skill mapping not found";
export const API_ERROR_PROJECT_NOT_FOUND = "Project not found";
export const API_ERROR_PORTFOLIO_NOT_FOUND = "Portfolio not found";
export const API_ERROR_SCREENSHOT_NOT_FOUND = "Screenshot not found";
export const API_ERROR_SESSION_NOT_FOUND = "Session not found";
export const API_ERROR_INTERVIEW_SESSION_NOT_FOUND = "Interview session not found";
export const API_ERROR_COVER_LETTER_NOT_FOUND = "Cover letter not found";
export const API_ERROR_STUDIO_NOT_FOUND = "Studio not found";
export const API_ERROR_APPLICATION_NOT_FOUND = "Application not found";
export const API_ERROR_CHALLENGE_NOT_FOUND = "Challenge already completed or not found";
export const API_ERROR_MISSING_AUTH_HEADER = "Missing or invalid Authorization header";
export const API_ERROR_INVALID_API_KEY = "Invalid API key";
export const API_ERROR_EMPTY_API_KEY = "Empty API key";
export const API_ERROR_AUTH_SETUP_TOKEN_REQUIRED = "Setup token is required";
export const API_ERROR_AUTH_SETUP_TOKEN_INVALID = "Setup token is invalid";
export const API_ERROR_AUTH_SETUP_TOKEN_UNAVAILABLE = "Setup token bootstrap is unavailable";
export const API_ERROR_INVALID_RESUME_PAYLOAD = "Invalid resume payload";
export const API_ERROR_INVALID_COVER_LETTER_PAYLOAD = "Invalid cover letter payload";
export const API_ERROR_INVALID_PORTFOLIO_PAYLOAD = "Invalid portfolio payload";
export const API_ERROR_INVALID_PORTFOLIO_PROJECT_PAYLOAD = "Invalid portfolio project payload";
export const API_ERROR_INVALID_INTERVIEW_SESSION_PAYLOAD = "Invalid interview session payload";
export const API_ERROR_INVALID_GAMIFICATION_PAYLOAD = "Invalid gamification payload";
export const API_ERROR_INVALID_SKILL_MAPPING_PAYLOAD = "Invalid skill mapping payload";
export const API_ERROR_NO_AI_PROVIDER_EMAIL =
  "No AI provider is available for email response generation";
export const API_ERROR_EMPTY_EMAIL_RESPONSE = "AI provider returned an empty email response";
export const API_ERROR_RUN_ID_INVALID = "runId is invalid";
export const API_ERROR_AI_NO_QUESTIONS = "AI returned no valid questions";
export const API_ERROR_CREATE_SKILL_MAPPING = "Failed to create skill mapping";
export const API_ERROR_PARSE_RESUME_SYNTHESIS = "Failed to parse AI resume synthesis";
export const API_ERROR_JOB_URL_REQUIRED = "jobUrl is required";
export const API_ERROR_JOB_URL_ABSOLUTE = "jobUrl must be an absolute URL";
export const API_ERROR_JOB_URL_HTTP_ONLY = "Only http and https job URLs are allowed";
export const API_ERROR_JOB_URL_NO_CREDENTIALS = "jobUrl must not contain credentials";
export const API_ERROR_JOB_URL_DISALLOWED_HOST = "jobUrl resolves to a disallowed host";
export const API_ERROR_CUSTOM_ANSWERS_OBJECT = "customAnswers must be an object map";
export const API_ERROR_CUSTOM_ANSWERS_KEYS = "customAnswers keys must not be empty";
export const API_ERROR_CREATE_RESUME = "Failed to create resume";
export const API_ERROR_CANNOT_MERGE_EMPTY_JOBS = "Cannot merge empty array of jobs";
export const API_ERROR_CREATE_COVER_LETTER = "Failed to create cover letter";
export const API_ERROR_CREATE_PROJECT = "Failed to create project";
export const API_ERROR_INVALID_PROJECT_ID_REORDER = "Invalid project ID in reorder payload";
export const API_ERROR_MISSING_SETTINGS_ROW =
  "Missing settings row for job provider runtime configuration";
export const API_ERROR_MISSING_JOB_PROVIDERS =
  "Missing or invalid settings.automationSettings.jobProviders configuration";
/** Use with .replace("__MAX__", String(MAX_JOB_URL_LENGTH)) */
export const API_ERROR_JOB_URL_EXCEEDS_LENGTH = "jobUrl exceeds __MAX__ characters";
/** Use with .replace("__MAX__", String(MAX_CUSTOM_ANSWER_COUNT)) */
export const API_ERROR_CUSTOM_ANSWERS_MAX_COUNT = "Maximum __MAX__ custom answers allowed";
/** Use with .replace("__MAX__", String(MAX_CUSTOM_ANSWER_KEY_LENGTH)) */
export const API_ERROR_CUSTOM_ANSWERS_KEY_EXCEEDS = "customAnswers key exceeds __MAX__ characters";
/** Use with .replace("__KEY__", key) */
export const API_ERROR_CUSTOM_ANSWERS_VALUE_MUST_BE_STRING =
  "customAnswers[__KEY__] must be a string value";
/** Use with .replace("__KEY__", key).replace("__MAX__", String(MAX_CUSTOM_ANSWER_VALUE_LENGTH)) */
export const API_ERROR_CUSTOM_ANSWERS_VALUE_EXCEEDS =
  "customAnswers[__KEY__] exceeds __MAX__ characters";
/** Use with: `${API_ERROR_AI_STREAMING_FAILED}: ${toErrorMessage(err)}` */
export const API_ERROR_AI_STREAMING_FAILED = "AI streaming error";
/** Use with: `${API_ERROR_ALL_PROVIDERS_STREAM_FAILED}: ${errorMessage}` */
export const API_ERROR_ALL_PROVIDERS_STREAM_FAILED = "All providers failed to stream";
/** Use with: `${API_ERROR_UNSUPPORTED_RESUME_TEMPLATE}: ${template}` */
export const API_ERROR_UNSUPPORTED_RESUME_TEMPLATE = "Unsupported resume template";
/** Use with: `${API_ERROR_INVALID_PORT}: ${port}` */
export const API_ERROR_INVALID_PORT = "Invalid PORT";

/** Default fallback for client-facing errors when no specific message is available. Use i18n key apiErrors.unexpected when possible. */
export const API_ERROR_UNEXPECTED = "An unexpected error occurred";

/** Validation failed (Elysia error handler). */
export const API_ERROR_VALIDATION_FAILED = "Validation failed";

/** Internal server error (Elysia error handler). */
export const API_ERROR_INTERNAL_SERVER = "Internal server error";

/** Screenshot index out of range. */
export const API_ERROR_SCREENSHOT_INDEX_OUT_OF_RANGE = "Screenshot index out of range";

/** Screenshot file missing from disk. */
export const API_ERROR_SCREENSHOT_FILE_MISSING = "Screenshot file missing from disk";

/** Portfolio id is not available. */
export const API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE = "Portfolio id is not available";

/** Automation run payload failed schema validation. */
export const API_ERROR_AUTOMATION_PAYLOAD_VALIDATION_FAILED =
  "Automation run payload failed schema validation";

/** Skill mapping already deleted. */
export const API_ERROR_SKILL_MAPPING_ALREADY_DELETED = "Skill mapping already deleted";

/** AI settings not configured. Please complete setup in Settings. */
export const API_ERROR_AI_SETTINGS_NOT_CONFIGURED =
  "AI settings not configured. Please complete setup in Settings.";

/** Cover letter generation failed. */
export const API_ERROR_COVER_LETTER_GENERATION_FAILED = "Cover letter generation failed";

/** Network request failed. */
export const API_ERROR_NETWORK_REQUEST_FAILED = "Network request failed";

/** AI operation timed out. */
export const API_ERROR_AI_OPERATION_TIMEOUT = "AI operation timed out";

/** studioId is required. */
export const API_ERROR_STUDIO_ID_REQUIRED = "studioId is required";

/** Use with: `API_ERROR_UNSUPPORTED_AUTOMATION_ACTION.replace("__ACTION__", action)` */
export const API_ERROR_UNSUPPORTED_AUTOMATION_ACTION = "Unsupported automation action: __ACTION__";

/** Job application automation failed. */
export const API_ERROR_JOB_APPLICATION_AUTOMATION_FAILED = "Job application automation failed";

/** Question ID or question index and response are required. */
export const API_ERROR_INTERVIEW_RESPONSE_REQUIRED =
  "questionId or questionIndex and response are required";

/** Unable to resolve question for this response. */
export const API_ERROR_INTERVIEW_QUESTION_UNRESOLVED =
  "Unable to resolve question for this response";

/** Gamification XP award payload incomplete. */
export const API_ERROR_XP_AMOUNT_REASON_REQUIRED = "amount and reason are required.";

/** Automation job-apply payload incomplete. */
export const API_ERROR_JOB_APPLY_FIELDS_REQUIRED = "jobUrl and resumeId are required.";

/** Scheduled automation job-apply payload incomplete. */
export const API_ERROR_SCHEDULED_JOB_APPLY_FIELDS_REQUIRED =
  "jobUrl, resumeId, and runAt are required.";

/** Automation email response payload incomplete. */
export const API_ERROR_EMAIL_RESPONSE_FIELDS_REQUIRED = "subject and message are required.";

/** Scheduled automation email response payload incomplete. */
export const API_ERROR_SCHEDULED_EMAIL_RESPONSE_FIELDS_REQUIRED =
  "subject, message, and runAt are required.";

/** Automation scrape target missing. */
export const API_ERROR_SCRAPE_TARGET_REQUIRED = "target is required.";

/** Scheduled scrape payload incomplete. */
export const API_ERROR_SCHEDULED_SCRAPE_FIELDS_REQUIRED = "target and runAt are required.";

/** Automation run id missing. */
export const API_ERROR_AUTOMATION_RUN_ID_REQUIRED = "id is required.";

/** User profile row missing (should be seeded at DB init). */
export const API_ERROR_USER_PROFILE_NOT_FOUND = "User profile not found";

/** Rate limit exceeded. */
export const API_ERROR_RATE_LIMIT_EXCEEDED = "Rate limit exceeded";

/** OpenAI-compatible: model id missing or unknown. */
export const API_ERROR_OPENAI_COMPAT_MODEL_NOT_FOUND = "The model does not exist";

/** OpenAI-compatible: chat messages missing. */
export const API_ERROR_OPENAI_COMPAT_MESSAGES_REQUIRED = "messages is required";

/** OpenAI-compatible: generation failed. */
export const API_ERROR_OPENAI_COMPAT_GENERATION_FAILED = "Failed to generate chat completion";
