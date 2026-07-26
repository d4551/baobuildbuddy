import type { ReadinessAssessment, RoleReadiness, SkillMapping } from "@bao/shared/types/skill-mapping";
export interface ReadinessJobTarget {
    readonly id: string;
    readonly title: string;
    readonly requirements: readonly string[];
    readonly technologies: readonly string[];
}
export declare const buildSkillReadinessAssessment: (mappings: SkillMapping[]) => ReadinessAssessment;
/**
 * Compares the candidate's skill mappings against a scraped job's requirements and
 * technologies, producing a `RoleReadiness` entry the readiness route returns as
 * `targetRoleReadiness`. The `?jobId` query used to be echoed back without reading
 * the job, so the UI could never show job-targeted gaps even though the contract
 * already declared the field.
 */
export declare const buildRoleReadiness: (job: ReadinessJobTarget, mappings: SkillMapping[]) => RoleReadiness;
export declare const buildSkillReadinessAssessmentForJob: (mappings: SkillMapping[], job: ReadinessJobTarget) => ReadinessAssessment;
