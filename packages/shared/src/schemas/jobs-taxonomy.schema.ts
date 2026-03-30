import z from "zod";
import { JOB_STUDIO_TYPES } from "../constants/jobs";
import { DEFAULT_JOB_TAXONOMY_SETTINGS } from "../constants/jobs-taxonomy";
import { JOB_TAXONOMY_KEYWORD_CATEGORY_IDS } from "../types/jobs-taxonomy";

export const jobTaxonomyKeywordCategorySchema = z.enum(JOB_TAXONOMY_KEYWORD_CATEGORY_IDS);

export const jobTaxonomyKeywordEntrySchema = z.object({
  id: z.string().trim().min(1),
  category: jobTaxonomyKeywordCategorySchema,
  label: z.string().trim().min(1),
  synonyms: z.array(z.string().trim().min(1)).default([]),
  sortOrder: z.number().int().min(0),
  enabled: z.boolean().default(true),
});

export const studioClassificationRuleSchema = z.object({
  id: z.string().trim().min(1),
  studioType: z.enum(JOB_STUDIO_TYPES),
  keyword: z.string().trim().min(1),
  sortOrder: z.number().int().min(0),
  enabled: z.boolean().default(true),
});

export const jobTaxonomySettingsSchema = z.object({
  keywords: z.array(jobTaxonomyKeywordEntrySchema).default(DEFAULT_JOB_TAXONOMY_SETTINGS.keywords),
  studioRules: z
    .array(studioClassificationRuleSchema)
    .default(DEFAULT_JOB_TAXONOMY_SETTINGS.studioRules),
});

export type JobTaxonomySettingsInput = z.infer<typeof jobTaxonomySettingsSchema>;
