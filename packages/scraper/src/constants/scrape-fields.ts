/**
 * Shared field and hash bounds for portal job scrapers.
 */

/** Maximum characters retained for scraped job titles. */
export const SCRAPED_JOB_TITLE_MAX_LENGTH = 200;

/** Maximum characters retained for scraped company names. */
export const SCRAPED_JOB_COMPANY_MAX_LENGTH = 100;

/** Maximum characters retained for scraped locations. */
export const SCRAPED_JOB_LOCATION_MAX_LENGTH = 100;

/** Maximum characters retained for scraped job descriptions. */
export const SCRAPED_JOB_DESCRIPTION_MAX_LENGTH = 500;

/** Minimum title length for most portal extractors. */
export const SCRAPED_JOB_TITLE_MIN_LENGTH = 5;

/** Minimum title length for sparse listing cards (Grackle / Work With Indies). */
export const SCRAPED_JOB_TITLE_MIN_LENGTH_SHORT = 3;

/** Maximum raw company-line length accepted before normalization. */
export const SCRAPED_JOB_COMPANY_LINE_MAX_LENGTH = 80;

/** Hex digest prefix length for scraper content hashes. */
export const SCRAPER_CONTENT_HASH_HEX_LENGTH = 12;
