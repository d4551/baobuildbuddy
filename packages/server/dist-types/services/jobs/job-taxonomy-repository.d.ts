import type { JobTaxonomySettings } from "@bao/shared/types/jobs-taxonomy";
export declare const readJobTaxonomy: () => Promise<JobTaxonomySettings>;
export declare const replaceJobTaxonomy: (taxonomy: JobTaxonomySettings) => Promise<JobTaxonomySettings>;
