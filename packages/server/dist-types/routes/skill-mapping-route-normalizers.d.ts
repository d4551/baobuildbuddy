import { type SkillCategory, type SkillEvidence, type SkillMapping } from "@bao/shared/types/skill-mapping";
type DemandLevel = SkillMapping["demandLevel"];
export declare const normalizeCategory: (value: unknown) => SkillCategory;
export declare const normalizeDemandLevel: (value: unknown) => DemandLevel;
export declare const normalizeStringArray: (value: unknown) => string[];
export declare const normalizeSkillEvidence: (value: unknown) => SkillEvidence[];
export declare const clampConfidence: (value: number | undefined) => number;
export declare const mapSuggestedMappingToCreateInput: (suggestedMapping: Record<string, unknown>) => {
    gameExpression: string;
    transferableSkill: string;
    industryApplications: string[];
    evidence: never[];
    confidence: number;
    category: "analytical" | "communication" | "community" | "creative" | "leadership" | "project_management" | "technical";
    demandLevel: "high" | "low" | "medium";
    verified: boolean;
    aiGenerated: boolean;
} | null;
export {};
