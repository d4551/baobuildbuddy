import z from "zod";
import {
  AUTOMATION_MAX_CUSTOM_ANSWER_COUNT,
  AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH,
  AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  AUTOMATION_MAX_JOB_URL_LENGTH,
} from "../constants/automation";
import {
  SCHEMA_MAX_LENGTH_DATE,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_SETTINGS_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "../constants/schema-limits";
import type { GamingPortalId } from "../types/settings";
import { jsonObjectSchema } from "./json.schema";
import { rpaProtocolVersionSchema, rpaRunIdentifierSchema } from "./rpa-protocol.schema";
import { automationSettingsSchema } from "./settings.schema";

/**
 * Stable automation script identifiers used by the server/runtime boundary.
 */
export const automationScriptIdSchema = z.enum([
  "job-apply",
  "studio-scraper",
  "scraper-hitmarker",
  "scraper-grackle",
  "scraper-workwithindies",
  "scraper-remotegamejobs",
  "scraper-gamesjobsdirect",
  "scraper-pocketgamer",
]);

/**
 * Stable subset of automation scripts that scrape gaming job portals.
 */
export const automationScraperScriptIdSchema = z.enum([
  "studio-scraper",
  "scraper-hitmarker",
  "scraper-grackle",
  "scraper-workwithindies",
  "scraper-remotegamejobs",
  "scraper-gamesjobsdirect",
  "scraper-pocketgamer",
]);

/**
 * Typed subset of scripts that target gaming-board providers.
 */
export const gamingPortalScraperScriptIdSchema = z.enum([
  "scraper-hitmarker",
  "scraper-grackle",
  "scraper-workwithindies",
  "scraper-remotegamejobs",
  "scraper-gamesjobsdirect",
  "scraper-pocketgamer",
]);

/**
 * Common runtime envelope supplied to every spawned automation script.
 */
export const automationScriptEnvelopeBaseSchema = z.object({
  protocolVersion: rpaProtocolVersionSchema,
  runId: rpaRunIdentifierSchema,
  outputDir: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).nullable().optional(),
});

/**
 * Input contract for scraper-style scripts that navigate a single source URL.
 */
export const scraperScriptInputSchema = z.object({
  sourceUrl: z.string().trim().url().max(SCHEMA_MAX_LENGTH_URL),
});

/**
 * Shared script-envelope contract for scraper executables.
 */
export const scraperScriptEnvelopeSchema = automationScriptEnvelopeBaseSchema.extend(
  scraperScriptInputSchema.shape,
);

/**
 * Shared normalized scraped-job contract consumed by services and tests.
 */
export const scrapedJobSchema = z.object({
  title: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  company: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  location: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  remote: z.boolean().optional(),
  description: z.string().trim().max(SCHEMA_MAX_LENGTH_DESCRIPTION).optional(),
  url: z.string().trim().max(SCHEMA_MAX_LENGTH_URL).optional(),
  source: z.string().trim().max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL).optional(),
  contentHash: z.string().trim().max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  postDate: z.string().trim().max(SCHEMA_MAX_LENGTH_DATE).optional(),
  postedDate: z.string().trim().max(SCHEMA_MAX_LENGTH_DATE).optional(),
});

/**
 * Shared normalized scraped-studio contract consumed by services and tests.
 */
export const scrapedStudioSchema = z.object({
  id: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  name: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  website: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_URL).optional(),
  location: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  size: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  type: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  description: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_DESCRIPTION).optional(),
  games: z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT)).optional(),
  technologies: z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT)).optional(),
  interviewStyle: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_DESCRIPTION).optional(),
  remoteWork: z.boolean().nullable().optional(),
});

/**
 * Shared cover-letter payload contract consumed by the job-apply runtime.
 */
export const jobApplyCoverLetterSchema = z.object({
  content: jsonObjectSchema,
});

/**
 * Shared selector override contract keyed by semantic automation field names.
 */
export const jobApplySelectorMapSchema = z.record(
  z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT)).max(20),
);

/**
 * Shared custom-answer contract for job application automation.
 */
export const jobApplyCustomAnswersSchema = z
  .record(
    z.string().trim().min(1).max(AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH),
    z.string().trim().max(AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH),
  )
  .refine(
    (answers) => Object.keys(answers).length <= AUTOMATION_MAX_CUSTOM_ANSWER_COUNT,
    `Maximum ${AUTOMATION_MAX_CUSTOM_ANSWER_COUNT} custom answers allowed`,
  );

/**
 * Shared business-level input payload contract for job-apply automation.
 */
export const jobApplyScriptInputSchema = z.object({
  jobUrl: z.string().trim().url().max(AUTOMATION_MAX_JOB_URL_LENGTH),
  resume: jsonObjectSchema,
  resumeFilePath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).optional(),
  coverLetter: jobApplyCoverLetterSchema.nullable().optional(),
  customAnswers: jobApplyCustomAnswersSchema.default({}),
  selectorMap: jobApplySelectorMapSchema.default({}),
});

/**
 * Shared full runtime-envelope contract for job-apply automation.
 */
export const jobApplyScriptEnvelopeSchema = automationScriptEnvelopeBaseSchema.extend({
  settings: automationSettingsSchema,
  ...jobApplyScriptInputSchema.shape,
});

/**
 * Stable mapping from gaming portal identifiers to runtime scraper scripts.
 */
export const gamingPortalScraperScriptIdByPortalId = {
  hitmarker: "scraper-hitmarker",
  grackle: "scraper-grackle",
  workwithindies: "scraper-workwithindies",
  remotegamejobs: "scraper-remotegamejobs",
  gamesjobsdirect: "scraper-gamesjobsdirect",
  pocketgamer: "scraper-pocketgamer",
} as const satisfies Record<GamingPortalId, GamingPortalScraperScriptId>;

/**
 * Stable mapping of script identifiers to canonical relative entrypoint filenames.
 */
export const automationScriptEntryById = {
  "job-apply": "src/scripts/job-apply.ts",
  "studio-scraper": "src/scripts/studio-scraper.ts",
  "scraper-hitmarker": "src/scripts/scraper-hitmarker.ts",
  "scraper-grackle": "src/scripts/scraper-grackle.ts",
  "scraper-workwithindies": "src/scripts/scraper-workwithindies.ts",
  "scraper-remotegamejobs": "src/scripts/scraper-remotegamejobs.ts",
  "scraper-gamesjobsdirect": "src/scripts/scraper-gamesjobsdirect.ts",
  "scraper-pocketgamer": "src/scripts/scraper-pocketgamer.ts",
} as const satisfies Record<AutomationScriptId, string>;

/**
 * Union type of every supported automation script identifier.
 */
export type AutomationScriptId = z.infer<typeof automationScriptIdSchema>;

/**
 * Union type of every supported scraper script identifier.
 */
export type AutomationScraperScriptId = z.infer<typeof automationScraperScriptIdSchema>;

/**
 * Union type of gaming-provider scraper scripts.
 */
export type GamingPortalScraperScriptId = z.infer<typeof gamingPortalScraperScriptIdSchema>;

/**
 * Union type of normalized scraped job rows.
 */
export type ScrapedJob = z.infer<typeof scrapedJobSchema>;

/**
 * Union type of normalized scraped studio rows.
 */
export type ScrapedStudio = z.infer<typeof scrapedStudioSchema>;

/**
 * Type-safe job-apply business payload.
 */
export type JobApplyScriptInput = z.infer<typeof jobApplyScriptInputSchema>;

/**
 * Type-safe job-apply full runtime envelope.
 */
export type JobApplyScriptEnvelope = z.infer<typeof jobApplyScriptEnvelopeSchema>;

/**
 * Type-safe scraper runtime envelope.
 */
export type ScraperScriptEnvelope = z.infer<typeof scraperScriptEnvelopeSchema>;
