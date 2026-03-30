import type { StudioType } from "./jobs";

export const JOB_TAXONOMY_KEYWORD_CATEGORY_IDS = [
  "remote-location",
  "hybrid-location",
  "requirement",
  "technology",
  "genre",
  "platform",
  "role",
] as const;

export type JobTaxonomyKeywordCategory = (typeof JOB_TAXONOMY_KEYWORD_CATEGORY_IDS)[number];

export interface JobTaxonomyKeywordEntry {
  id: string;
  category: JobTaxonomyKeywordCategory;
  label: string;
  synonyms: string[];
  sortOrder: number;
  enabled: boolean;
}

export interface StudioClassificationRule {
  id: string;
  studioType: StudioType;
  keyword: string;
  sortOrder: number;
  enabled: boolean;
}

export interface JobTaxonomySettings {
  keywords: JobTaxonomyKeywordEntry[];
  studioRules: StudioClassificationRule[];
}
