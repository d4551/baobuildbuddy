import type { CareerPathway, ReadinessAssessment, SkillMapping } from "@bao/shared";
export declare class SkillMappingService {
    /**
     * Get all skill mappings
     */
    getMappings(): Promise<SkillMapping[]>;
    /**
     * Create a new skill mapping
     */
    createMapping(data: Omit<SkillMapping, "id">): Promise<SkillMapping>;
    /**
     * Get a single skill mapping by ID
     */
    getMapping(id: string): Promise<SkillMapping | null>;
    /**
     * Update a skill mapping
     */
    updateMapping(id: string, data: Partial<SkillMapping>): Promise<SkillMapping | null>;
    /**
     * Delete a skill mapping by ID.
     *
     * @param id - The mapping identifier to remove
     * @returns true when a row was deleted, false when nothing matched
     */
    deleteMapping(id: string): Promise<boolean>;
    /**
     * Get career pathways grouped by category
     */
    getPathways(): Promise<CareerPathway[]>;
    /**
     * Calculate career readiness based on skill mappings
     */
    getReadiness(): Promise<ReadinessAssessment>;
    /**
     * Calculate average confidence score for a category
     */
    private calculateCategoryScore;
    /**
     * Get feedback text for a category score
     */
    private getCategoryFeedback;
    /**
     * Get improvement suggestions based on scores
     */
    private getImprovementSuggestions;
    /**
     * Get next steps based on overall readiness
     */
    private getNextSteps;
    private normalizeDemandLevel;
}
export declare const skillMappingService: SkillMappingService;
