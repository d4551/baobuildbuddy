/**
 * Default automation timing budgets (ms) for scraper/job-apply runtimes.
 * Env overrides are applied in `@bao/scraper` runtime config.
 */

import { MS_THREE_SECONDS, MS_TWO_SECONDS } from "./numeric";

/** Default post-navigation settle budget before DOM extraction. */
export const AUTOMATION_PAGE_SETTLE_DELAY_MS_DEFAULT = MS_TWO_SECONDS;

/** Default settle budget after follow-up ATS navigation. */
export const AUTOMATION_SECONDARY_NAVIGATION_DELAY_MS_DEFAULT = MS_TWO_SECONDS;

/** Default delay after submit before confirmation verification. */
export const AUTOMATION_POST_SUBMIT_DELAY_MS_DEFAULT = MS_THREE_SECONDS;
