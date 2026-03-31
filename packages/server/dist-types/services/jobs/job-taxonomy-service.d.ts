import type { JobTaxonomySettings } from "@bao/shared/types/jobs-taxonomy";
export declare const getJobTaxonomy: () => Promise<JobTaxonomySettings>;
export declare const refreshJobTaxonomy: () => Promise<JobTaxonomySettings>;
export declare const updateJobTaxonomy: (taxonomy: JobTaxonomySettings) => Promise<JobTaxonomySettings>;
