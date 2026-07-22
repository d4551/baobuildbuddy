/**
 * Canonical text field bounds for normalized scraper job rows.
 * Single source of truth shared by RPA provider extractors.
 */

/** Maximum characters retained for a scraped job title. */
export const SCRAPER_JOB_TITLE_MAX_LENGTH = 200;

/** Maximum characters retained for a scraped company name. */
export const SCRAPER_JOB_COMPANY_MAX_LENGTH = 100;

/** Maximum characters retained for a scraped location label. */
export const SCRAPER_JOB_LOCATION_MAX_LENGTH = 100;

/** Maximum characters retained for a scraped job description. */
export const SCRAPER_JOB_DESCRIPTION_MAX_LENGTH = 500;

/** Minimum normalized title length for a scraped job row to be kept. */
export const SCRAPER_JOB_TITLE_MIN_LENGTH = 5;
