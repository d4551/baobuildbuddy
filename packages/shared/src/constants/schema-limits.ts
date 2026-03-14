/**
 * Canonical schema length limits used across validation schemas.
 * Single source of truth for max lengths. No hardcoded values in routes.
 */
export const SCHEMA_MAX_LENGTH_TINY = 10;
export const SCHEMA_MAX_LENGTH_MICRO = 20;
export const SCHEMA_MAX_LENGTH_SOURCE = 32;
export const SCHEMA_MAX_LENGTH_ENTITY_TYPE = 64;
export const SCHEMA_MAX_LENGTH_LABEL = 50;
export const SCHEMA_MAX_LENGTH_ID = 100;
export const SCHEMA_MAX_LENGTH_DEVICE = 120;
export const SCHEMA_MAX_LENGTH_PHONE = 30;
export const SCHEMA_MAX_LENGTH_EMAIL = 320;
export const SCHEMA_MAX_LENGTH_URL = 500;
export const SCHEMA_MAX_LENGTH_DATE = 80;
export const SCHEMA_MAX_LENGTH_ACHIEVEMENT = 300;
export const SCHEMA_MAX_LENGTH_DESCRIPTION = 5000;
export const SCHEMA_MAX_LENGTH_SHIPPED = 1000;
export const SCHEMA_MAX_LENGTH_MESSAGE = 10000;
export const SCHEMA_MAX_LENGTH_EMAIL_MESSAGE = 12_000;
export const SCHEMA_MAX_LENGTH_JOB_DESCRIPTION = 20_000;
export const SCHEMA_MAX_LENGTH_SHORT = 200;
export const SCHEMA_MAX_LENGTH_LONG = 2000;

export const SCHEMA_MAX_ITEMS_SMALL = 20;
export const SCHEMA_MAX_ITEMS_MEDIUM = 30;
export const SCHEMA_MAX_ITEMS_LARGE = 50;
export const SCHEMA_MAX_ITEMS_XLARGE = 60;
export const SCHEMA_MAX_ITEMS_XXLARGE = 100;
export const SCHEMA_MAX_ITEMS_BOARDS = 500;

export const SCHEMA_MAX_LENGTH_MODEL = 200;
export const SCHEMA_MAX_LENGTH_API_KEY = 500;
export const SCHEMA_MAX_LENGTH_SETTINGS_LABEL = 120;
export const SCHEMA_MAX_LENGTH_SETTINGS_URL = 200;
export const SCHEMA_MAX_LENGTH_RUN_ID = 128;
export const RUN_ID_MIN_LENGTH = 8;
export const RUN_ID_SAFE_PATTERN_SOURCE = "^[0-9a-fA-F-]+$";
/** Max result limit for company/gaming board queries in settings. */
export const SCHEMA_MAX_BOARD_RESULT_LIMIT = 200;

/** Minimum provider timeout in ms for AI settings. */
export const SCHEMA_PROVIDER_TIMEOUT_MIN_MS = 1_000;

/** Maximum provider timeout in ms for AI settings. */
export const SCHEMA_PROVIDER_TIMEOUT_MAX_MS = 120_000;

/** Minimum max pages for Greenhouse/Lever API settings. */
export const SCHEMA_MAX_PAGES_MIN = 1;

/** Maximum max pages for Greenhouse/Lever API settings. */
export const SCHEMA_MAX_PAGES_MAX = 20;
