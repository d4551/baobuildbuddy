interface ExtractedSkill {
    name: string;
    category: "engines" | "programming" | "design" | "art" | "tools" | "gamingTech" | "esports" | "transferable";
    confidence: number;
    proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
    source: string;
}
interface SkillGapAnalysis {
    matchPercentage: number;
    matched: string[];
    missing: string[];
    extra: string[];
    recommendations: string[];
}
export declare class SkillExtractor {
    extractSkills(text: string): Promise<ExtractedSkill[]>;
    extractFromJobDescription(description: string): Promise<{
        required: ExtractedSkill[];
        preferred: ExtractedSkill[];
    }>;
    compareSkills(userSkills: ExtractedSkill[], jobSkills: ExtractedSkill[]): SkillGapAnalysis;
    mapGamingToCareer(gamingExperiences: string[]): Promise<Array<{
        gaming: string;
        professional: string;
    }>>;
    private detectProficiency;
    private getSurroundingText;
}
export declare const skillExtractor: SkillExtractor;
export {};
