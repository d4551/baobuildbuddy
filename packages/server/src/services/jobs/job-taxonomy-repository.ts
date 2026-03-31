import { DEFAULT_JOB_TAXONOMY_SETTINGS } from "@bao/shared/constants/jobs-taxonomy";
import { jobTaxonomySettingsSchema } from "@bao/shared/schemas/jobs-taxonomy.schema";
import type { JobTaxonomyKeywordEntry, JobTaxonomySettings, StudioClassificationRule } from "@bao/shared/types/jobs-taxonomy";
import { asc } from "drizzle-orm";
import { db } from "../../db/client";
import { jobTaxonomyKeywords, studioClassificationRules } from "../../db/schema/job-taxonomy";

const mapKeywordRow = (row: typeof jobTaxonomyKeywords.$inferSelect): JobTaxonomyKeywordEntry => ({
  id: row.id,
  category: row.category,
  label: row.label,
  synonyms: Array.isArray(row.synonyms) ? row.synonyms : [],
  sortOrder: row.sortOrder,
  enabled: row.enabled,
});

const mapStudioRuleRow = (
  row: typeof studioClassificationRules.$inferSelect,
): StudioClassificationRule => ({
  id: row.id,
  studioType: row.studioType,
  keyword: row.keyword,
  sortOrder: row.sortOrder,
  enabled: row.enabled,
});

const insertKeywordRow = (
  entry: JobTaxonomyKeywordEntry,
): typeof jobTaxonomyKeywords.$inferInsert => ({
  id: entry.id,
  category: entry.category,
  label: entry.label,
  synonyms: entry.synonyms,
  sortOrder: entry.sortOrder,
  enabled: entry.enabled,
  updatedAt: new Date().toISOString(),
});

const insertStudioRuleRow = (
  entry: StudioClassificationRule,
): typeof studioClassificationRules.$inferInsert => ({
  id: entry.id,
  studioType: entry.studioType,
  keyword: entry.keyword,
  sortOrder: entry.sortOrder,
  enabled: entry.enabled,
  updatedAt: new Date().toISOString(),
});

const seedDefaults = async (): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx
      .insert(jobTaxonomyKeywords)
      .values(DEFAULT_JOB_TAXONOMY_SETTINGS.keywords.map(insertKeywordRow));
    await tx
      .insert(studioClassificationRules)
      .values(DEFAULT_JOB_TAXONOMY_SETTINGS.studioRules.map(insertStudioRuleRow));
  });
};

const ensureJobTaxonomyRows = async (): Promise<void> => {
  const [keywordRows, studioRuleRows] = await Promise.all([
    db.select({ id: jobTaxonomyKeywords.id }).from(jobTaxonomyKeywords).limit(1),
    db.select({ id: studioClassificationRules.id }).from(studioClassificationRules).limit(1),
  ]);

  if (keywordRows.length === 0 && studioRuleRows.length === 0) {
    await seedDefaults();
  }
};

export const readJobTaxonomy = async (): Promise<JobTaxonomySettings> => {
  await ensureJobTaxonomyRows();

  const [keywordRows, studioRuleRows] = await Promise.all([
    db
      .select()
      .from(jobTaxonomyKeywords)
      .orderBy(asc(jobTaxonomyKeywords.category), asc(jobTaxonomyKeywords.sortOrder)),
    db
      .select()
      .from(studioClassificationRules)
      .orderBy(asc(studioClassificationRules.studioType), asc(studioClassificationRules.sortOrder)),
  ]);

  const parsed = jobTaxonomySettingsSchema.safeParse({
    keywords: keywordRows.map(mapKeywordRow),
    studioRules: studioRuleRows.map(mapStudioRuleRow),
  });

  return parsed.success ? parsed.data : DEFAULT_JOB_TAXONOMY_SETTINGS;
};

export const replaceJobTaxonomy = async (
  taxonomy: JobTaxonomySettings,
): Promise<JobTaxonomySettings> => {
  const parsed = jobTaxonomySettingsSchema.safeParse(taxonomy);
  const nextTaxonomy = parsed.success ? parsed.data : DEFAULT_JOB_TAXONOMY_SETTINGS;

  await db.transaction(async (tx) => {
    await tx.delete(jobTaxonomyKeywords);
    await tx.delete(studioClassificationRules);

    if (nextTaxonomy.keywords.length > 0) {
      await tx.insert(jobTaxonomyKeywords).values(nextTaxonomy.keywords.map(insertKeywordRow));
    }
    if (nextTaxonomy.studioRules.length > 0) {
      await tx
        .insert(studioClassificationRules)
        .values(nextTaxonomy.studioRules.map(insertStudioRuleRow));
    }
  });

  return nextTaxonomy;
};
