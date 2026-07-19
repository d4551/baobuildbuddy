import type { SkillAnalyzeBody, SkillMappingRouteSetState } from "./skill-mapping-route-contracts";
type SkillSuggestedMapping = Record<string, string | number | boolean | null>;
type SkillAnalysisResponse = {
    message: string;
    detectedSkills: string[];
    suggestedMappings: SkillSuggestedMapping[];
    recommendations: string[];
    provider?: string;
};
export declare const analyzeSkillMappingsSafely: (body: SkillAnalyzeBody, set: SkillMappingRouteSetState) => Promise<SkillAnalysisResponse>;
export {};
