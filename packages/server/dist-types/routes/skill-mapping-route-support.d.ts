import type { SkillMappingMutationBody, SkillMappingRouteSetState, SkillMappingUpdateBody, SkillMappingsQuery } from "./skill-mapping-route-contracts";
export declare const listSkillMappings: (query: SkillMappingsQuery) => Promise<{
    id: string;
    gameExpression: string;
    transferableSkill: string;
    industryApplications: string[] | null;
    evidence: unknown[] | null;
    confidence: number | null;
    category: string | null;
    demandLevel: string | null;
    aiGenerated: boolean | null;
    createdAt: string;
    updatedAt: string;
}[]>;
export declare const createSkillMappingFromBody: (body: SkillMappingMutationBody) => Promise<{
    mapping: import("@bao/shared").SkillMapping;
    statusCode: number;
}>;
export declare const updateSkillMappingFromBody: (id: string, body: SkillMappingUpdateBody, set: SkillMappingRouteSetState) => Promise<import("@bao/shared").SkillMapping | {
    error: string;
}>;
export declare const deleteSkillMappingById: (id: string, set: SkillMappingRouteSetState) => Promise<{
    kind: "not-found";
    payload: {
        error: string;
        id?: undefined;
        message?: undefined;
    };
    statusCode?: undefined;
} | {
    kind: "gone";
    payload: {
        error: string;
        id: string;
        message?: undefined;
    };
    statusCode: number;
} | {
    kind: "deleted";
    payload: {
        message: string;
        id: string;
        error?: undefined;
    };
    statusCode: number;
}>;
export declare const getSkillReadiness: (jobId?: string) => Promise<import("@bao/shared").ReadinessAssessment | {
    jobId: string;
    overallScore: number;
    categories: {
        technical: import("@bao/shared").CategoryAssessment;
        softSkills: import("@bao/shared").CategoryAssessment;
        industryKnowledge: import("@bao/shared").CategoryAssessment;
        portfolio: import("@bao/shared").CategoryAssessment;
    };
    improvementSuggestions: import("@bao/shared").SkillReadinessImprovementId[];
    nextSteps: import("@bao/shared").SkillReadinessNextStepId[];
    targetRoleReadiness?: import("@bao/shared").RoleReadiness[];
}>;
