import type { SkillCategory, SkillEvidence, SkillMapping } from "@bao/shared";
import type { skillMappings } from "../db/schema/skill-mappings";
type SkillMappingRow = typeof skillMappings.$inferSelect;
type DemandLevel = SkillMapping["demandLevel"];
export declare const normalizeSkillCategory: (value: string | null) => SkillCategory;
export declare const normalizeDemandLevel: (value: string | null) => DemandLevel;
export declare const normalizeEvidenceEntries: (value: unknown[] | null) => SkillEvidence[];
export declare const toSkillMapping: (row: SkillMappingRow) => SkillMapping;
export {};
