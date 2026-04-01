import type { SkillAnalyzeBody, SkillMappingRouteSetState } from "./skill-mapping-route-contracts";
type SkillAnalysisResponse = {
    message: string;
    detectedSkills: string[];
    suggestedMappings: Record<string, unknown>[];
    recommendations: string[];
    provider?: string;
};
export declare const analyzeSkillMappingsSafely: (body: SkillAnalyzeBody, set: SkillMappingRouteSetState) => Promise<SkillAnalysisResponse>;
export {};
