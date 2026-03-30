import type { JobTaxonomySettings } from "@bao/shared";
export declare const getJobTaxonomy: () => Promise<JobTaxonomySettings>;
export declare const refreshJobTaxonomy: () => Promise<JobTaxonomySettings>;
export declare const updateJobTaxonomy: (taxonomy: JobTaxonomySettings) => Promise<JobTaxonomySettings>;
