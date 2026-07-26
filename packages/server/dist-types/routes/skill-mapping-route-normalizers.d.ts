import { type SkillCategory, type SkillEvidence } from "@bao/shared/types/skill-mapping";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
export declare const normalizeCategory: (value: JsonValue | undefined) => SkillCategory;
export declare const normalizeStringArray: (value: JsonValue | undefined) => string[];
export declare const normalizeSkillEvidence: (value: JsonValue | undefined) => SkillEvidence[];
export declare const clampConfidence: (value: number | undefined) => number;
export declare const mapSuggestedMappingToCreateInput: (suggestedMapping: JsonObject) => {
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
