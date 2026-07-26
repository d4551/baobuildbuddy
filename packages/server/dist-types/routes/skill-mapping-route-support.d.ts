import type { SkillMappingMutationBody, SkillMappingRouteSetState, SkillMappingsQuery, SkillMappingUpdateBody } from "./skill-mapping-route-contracts";
export declare const listSkillMappings: (query: SkillMappingsQuery) => Promise<{
    id: string;
    gameExpression: string;
    transferableSkill: string;
    industryApplications: string[] | null;
    evidence: import("@bao/shared/types/skill-mapping").SkillEvidence[] | null;
    confidence: number | null;
    category: string | null;
    demandLevel: string | null;
    aiGenerated: boolean | null;
    createdAt: string;
    updatedAt: string;
}[]>;
export declare const createSkillMappingFromBody: (body: SkillMappingMutationBody) => Promise<{
    mapping: import("@bao/shared/types/skill-mapping").SkillMapping;
    statusCode: number;
}>;
export declare const updateSkillMappingFromBody: (id: string, body: SkillMappingUpdateBody, set: SkillMappingRouteSetState) => Promise<import("@bao/shared/types/skill-mapping").SkillMapping | {
    error: string;
}>;
export declare const deleteSkillMappingById: (id: string, set: SkillMappingRouteSetState) => Promise<{
    statusCode?: undefined;
    kind: "not-found";
    payload: {
        message?: undefined;
        error: string;
        id?: undefined;
    };
} | {
    kind: "gone";
    payload: {
        message?: undefined;
        error: string;
        id: string;
    };
    statusCode: number;
} | {
    kind: "deleted";
    payload: {
        error?: undefined;
        message: string;
        id: string;
    };
    statusCode: number;
}>;
export declare const getSkillReadiness: (jobId?: string) => Promise<import("@bao/shared/types/skill-mapping").ReadinessAssessment | {
    overallScore: number;
    categories: {
        technical: import("@bao/shared/types/skill-mapping").CategoryAssessment;
        softSkills: import("@bao/shared/types/skill-mapping").CategoryAssessment;
        industryKnowledge: import("@bao/shared/types/skill-mapping").CategoryAssessment;
        portfolio: import("@bao/shared/types/skill-mapping").CategoryAssessment;
    };
    improvementSuggestions: import("@bao/shared/types/skill-mapping").SkillReadinessImprovementId[];
    nextSteps: import("@bao/shared/types/skill-mapping").SkillReadinessNextStepId[];
    targetRoleReadiness?: import("@bao/shared/types/skill-mapping").RoleReadiness[];
    jobId: string;
}>;
