import type { JobTaxonomySettings } from "@bao/shared";
import { readJobTaxonomy, replaceJobTaxonomy } from "./job-taxonomy-repository";

let taxonomyCache: Promise<JobTaxonomySettings> | null = null;

export const getJobTaxonomy = async (): Promise<JobTaxonomySettings> => {
  if (taxonomyCache === null) {
    taxonomyCache = readJobTaxonomy();
  }

  return taxonomyCache;
};

export const refreshJobTaxonomy = async (): Promise<JobTaxonomySettings> => {
  taxonomyCache = readJobTaxonomy();
  return taxonomyCache;
};

export const updateJobTaxonomy = async (
  taxonomy: JobTaxonomySettings,
): Promise<JobTaxonomySettings> => {
  const updated = await replaceJobTaxonomy(taxonomy);
  taxonomyCache = Promise.resolve(updated);
  return updated;
};
