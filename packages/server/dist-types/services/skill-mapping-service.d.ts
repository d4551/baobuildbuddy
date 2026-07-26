import type { CareerPathway, ReadinessAssessment, SkillMapping } from "@bao/shared/types/skill-mapping";
export declare class SkillMappingService {
    getMappings(): Promise<SkillMapping[]>;
    createMapping(data: Omit<SkillMapping, "id">): Promise<SkillMapping>;
    getMapping(id: string): Promise<SkillMapping | null>;
    updateMapping(id: string, data: Partial<SkillMapping>): Promise<SkillMapping | null>;
    deleteMapping(id: string): Promise<boolean>;
    getPathways(): Promise<CareerPathway[]>;
    getReadiness(): Promise<ReadinessAssessment>;
    getReadinessForJob(jobId: string): Promise<ReadinessAssessment | null>;
}
export declare const skillMappingService: SkillMappingService;
