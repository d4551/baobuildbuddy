import { type JobTaxonomySettings } from "@bao/shared";
export declare const readJobTaxonomy: () => Promise<JobTaxonomySettings>;
export declare const replaceJobTaxonomy: (taxonomy: JobTaxonomySettings) => Promise<JobTaxonomySettings>;
