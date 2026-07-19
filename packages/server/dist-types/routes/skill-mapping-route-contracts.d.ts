import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import type { Static } from "typebox";
export type SkillMappingsQuery = {
    category?: string;
    search?: string;
};
export type SkillMappingMutationBody = {
    gameExpression: string;
    transferableSkill: string;
    industryApplications?: string[];
    evidence?: JsonValue;
    confidence?: number;
    category?: string;
    demandLevel?: string;
    aiGenerated?: boolean;
};
export type SkillMappingUpdateBody = Partial<SkillMappingMutationBody>;
export type SkillAnalyzeBody = {
    gameExperience?: JsonObject;
    resume?: JsonObject;
    autoCreateMappings?: boolean;
};
export type SkillMappingRouteSetState = {
    status?: number | string;
};
export declare const skillMappingsQuerySchema: import("typebox").TObject<{
    category: import("typebox").TOptional<import("typebox").TString>;
    search: import("typebox").TOptional<import("typebox").TString>;
}>;
export type SkillMappingsRouteQuery = Static<typeof skillMappingsQuerySchema>;
export declare const skillMappingIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type SkillMappingIdParams = Static<typeof skillMappingIdParamsSchema>;
export declare const skillMappingCreateBodySchema: import("typebox").TObject<{
    gameExpression: import("typebox").TString;
    transferableSkill: import("typebox").TString;
    industryApplications: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    evidence: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TOptional<import("typebox").TString>;
        type: import("typebox").TOptional<import("typebox").TString>;
        title: import("typebox").TString;
        description: import("typebox").TString;
        url: import("typebox").TOptional<import("typebox").TString>;
        verificationStatus: import("typebox").TOptional<import("typebox").TString>;
    }>>>;
    confidence: import("typebox").TOptional<import("typebox").TNumber>;
    category: import("typebox").TOptional<import("typebox").TString>;
    demandLevel: import("typebox").TOptional<import("typebox").TString>;
    aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type SkillMappingCreateRouteBody = Static<typeof skillMappingCreateBodySchema>;
export declare const skillMappingUpdateBodySchema: import("typebox").TObject<{
    gameExpression: import("typebox").TOptional<import("typebox").TString>;
    transferableSkill: import("typebox").TOptional<import("typebox").TString>;
    industryApplications: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    evidence: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TOptional<import("typebox").TString>;
        type: import("typebox").TOptional<import("typebox").TString>;
        title: import("typebox").TString;
        description: import("typebox").TString;
        url: import("typebox").TOptional<import("typebox").TString>;
        verificationStatus: import("typebox").TOptional<import("typebox").TString>;
    }>>>;
    confidence: import("typebox").TOptional<import("typebox").TNumber>;
    category: import("typebox").TOptional<import("typebox").TString>;
    demandLevel: import("typebox").TOptional<import("typebox").TString>;
    aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type SkillMappingUpdateRouteBody = Static<typeof skillMappingUpdateBodySchema>;
export declare const skillAnalysisBodySchema: import("typebox").TObject<{
    gameExperience: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>;
    resume: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>;
    autoCreateMappings: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type SkillAnalysisRouteBody = Static<typeof skillAnalysisBodySchema>;
export declare const skillReadinessQuerySchema: import("typebox").TObject<{
    jobId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type SkillReadinessRouteQuery = Static<typeof skillReadinessQuerySchema>;
export declare const skillEvidenceResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    type: import("typebox").TString;
    title: import("typebox").TString;
    description: import("typebox").TString;
    url: import("typebox").TOptional<import("typebox").TString>;
    verificationStatus: import("typebox").TString;
}>;
export declare const skillMappingRowResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    gameExpression: import("typebox").TString;
    transferableSkill: import("typebox").TString;
    industryApplications: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
    evidence: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        type: import("typebox").TString;
        title: import("typebox").TString;
        description: import("typebox").TString;
        url: import("typebox").TOptional<import("typebox").TString>;
        verificationStatus: import("typebox").TString;
    }>>, import("typebox").TNull]>;
    confidence: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
    category: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    demandLevel: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    aiGenerated: import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>;
    createdAt: import("typebox").TString;
    updatedAt: import("typebox").TString;
}>;
export declare const skillMappingResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    gameExpression: import("typebox").TString;
    transferableSkill: import("typebox").TString;
    industryApplications: import("typebox").TArray<import("typebox").TString>;
    evidenceSuggestions: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    evidence: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        type: import("typebox").TString;
        title: import("typebox").TString;
        description: import("typebox").TString;
        url: import("typebox").TOptional<import("typebox").TString>;
        verificationStatus: import("typebox").TString;
    }>>;
    confidence: import("typebox").TNumber;
    category: import("typebox").TString;
    demandLevel: import("typebox").TString;
    verified: import("typebox").TBoolean;
    aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export declare const careerPathwayResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    title: import("typebox").TString;
    description: import("typebox").TString;
    detailedDescription: import("typebox").TOptional<import("typebox").TString>;
    matchScore: import("typebox").TNumber;
    stages: import("typebox").TArray<import("typebox").TObject<{
        title: import("typebox").TString;
        duration: import("typebox").TString;
        description: import("typebox").TString;
        completed: import("typebox").TOptional<import("typebox").TBoolean>;
        current: import("typebox").TOptional<import("typebox").TBoolean>;
        requirements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        outcomes: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>>;
    requiredSkills: import("typebox").TArray<import("typebox").TString>;
    estimatedTimeToEntry: import("typebox").TString;
    icon: import("typebox").TOptional<import("typebox").TString>;
    averageSalary: import("typebox").TOptional<import("typebox").TObject<{
        min: import("typebox").TNumber;
        max: import("typebox").TNumber;
        currency: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    jobMarketTrend: import("typebox").TString;
}>;
export declare const skillReadinessResponseSchema: import("typebox").TObject<{
    overallScore: import("typebox").TNumber;
    categories: import("typebox").TObject<{
        technical: import("typebox").TObject<{
            score: import("typebox").TNumber;
            feedbackId: import("typebox").TString;
            strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        softSkills: import("typebox").TObject<{
            score: import("typebox").TNumber;
            feedbackId: import("typebox").TString;
            strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        industryKnowledge: import("typebox").TObject<{
            score: import("typebox").TNumber;
            feedbackId: import("typebox").TString;
            strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        portfolio: import("typebox").TObject<{
            score: import("typebox").TNumber;
            feedbackId: import("typebox").TString;
            strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
    }>;
    improvementSuggestions: import("typebox").TArray<import("typebox").TString>;
    nextSteps: import("typebox").TArray<import("typebox").TString>;
    targetRoleReadiness: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
        roleId: import("typebox").TString;
        roleTitle: import("typebox").TString;
        readinessScore: import("typebox").TNumber;
        missingSkills: import("typebox").TArray<import("typebox").TString>;
        matchingSkills: import("typebox").TArray<import("typebox").TString>;
        timeToReady: import("typebox").TOptional<import("typebox").TString>;
        recommendedActions: import("typebox").TArray<import("typebox").TString>;
    }>>>;
    jobId: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const skillAnalysisResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    detectedSkills: import("typebox").TArray<import("typebox").TString>;
    suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>;
    recommendations: import("typebox").TArray<import("typebox").TString>;
    provider: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const skillMappingDeleteResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    id: import("typebox").TString;
}>;
export declare const skillMappingsListResponses: {
    200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        gameExpression: import("typebox").TString;
        transferableSkill: import("typebox").TString;
        industryApplications: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
        evidence: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            type: import("typebox").TString;
            title: import("typebox").TString;
            description: import("typebox").TString;
            url: import("typebox").TOptional<import("typebox").TString>;
            verificationStatus: import("typebox").TString;
        }>>, import("typebox").TNull]>;
        confidence: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
        category: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        demandLevel: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        aiGenerated: import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>;
        createdAt: import("typebox").TString;
        updatedAt: import("typebox").TString;
    }>>;
};
export declare const skillMappingCreateResponses: {
    201: import("typebox").TObject<{
        id: import("typebox").TString;
        gameExpression: import("typebox").TString;
        transferableSkill: import("typebox").TString;
        industryApplications: import("typebox").TArray<import("typebox").TString>;
        evidenceSuggestions: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        evidence: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            type: import("typebox").TString;
            title: import("typebox").TString;
            description: import("typebox").TString;
            url: import("typebox").TOptional<import("typebox").TString>;
            verificationStatus: import("typebox").TString;
        }>>;
        confidence: import("typebox").TNumber;
        category: import("typebox").TString;
        demandLevel: import("typebox").TString;
        verified: import("typebox").TBoolean;
        aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
    }>;
};
export declare const skillMappingUpdateResponses: {
    200: import("typebox").TObject<{
        id: import("typebox").TString;
        gameExpression: import("typebox").TString;
        transferableSkill: import("typebox").TString;
        industryApplications: import("typebox").TArray<import("typebox").TString>;
        evidenceSuggestions: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        evidence: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            type: import("typebox").TString;
            title: import("typebox").TString;
            description: import("typebox").TString;
            url: import("typebox").TOptional<import("typebox").TString>;
            verificationStatus: import("typebox").TString;
        }>>;
        confidence: import("typebox").TNumber;
        category: import("typebox").TString;
        demandLevel: import("typebox").TString;
        verified: import("typebox").TBoolean;
        aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
    }>;
    404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const skillMappingDeleteResponses: {
    200: import("typebox").TObject<{
        message: import("typebox").TString;
        id: import("typebox").TString;
    }>;
    410: import("typebox").TObject<{
        error: import("typebox").TString;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    404: import("typebox").TObject<{
        error: import("typebox").TString;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const skillPathwaysResponses: {
    200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        title: import("typebox").TString;
        description: import("typebox").TString;
        detailedDescription: import("typebox").TOptional<import("typebox").TString>;
        matchScore: import("typebox").TNumber;
        stages: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            duration: import("typebox").TString;
            description: import("typebox").TString;
            completed: import("typebox").TOptional<import("typebox").TBoolean>;
            current: import("typebox").TOptional<import("typebox").TBoolean>;
            requirements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            outcomes: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        requiredSkills: import("typebox").TArray<import("typebox").TString>;
        estimatedTimeToEntry: import("typebox").TString;
        icon: import("typebox").TOptional<import("typebox").TString>;
        averageSalary: import("typebox").TOptional<import("typebox").TObject<{
            min: import("typebox").TNumber;
            max: import("typebox").TNumber;
            currency: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        jobMarketTrend: import("typebox").TString;
    }>>;
};
export declare const skillReadinessResponses: {
    200: import("typebox").TObject<{
        overallScore: import("typebox").TNumber;
        categories: import("typebox").TObject<{
            technical: import("typebox").TObject<{
                score: import("typebox").TNumber;
                feedbackId: import("typebox").TString;
                strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
            softSkills: import("typebox").TObject<{
                score: import("typebox").TNumber;
                feedbackId: import("typebox").TString;
                strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
            industryKnowledge: import("typebox").TObject<{
                score: import("typebox").TNumber;
                feedbackId: import("typebox").TString;
                strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
            portfolio: import("typebox").TObject<{
                score: import("typebox").TNumber;
                feedbackId: import("typebox").TString;
                strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        }>;
        improvementSuggestions: import("typebox").TArray<import("typebox").TString>;
        nextSteps: import("typebox").TArray<import("typebox").TString>;
        targetRoleReadiness: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
            roleId: import("typebox").TString;
            roleTitle: import("typebox").TString;
            readinessScore: import("typebox").TNumber;
            missingSkills: import("typebox").TArray<import("typebox").TString>;
            matchingSkills: import("typebox").TArray<import("typebox").TString>;
            timeToReady: import("typebox").TOptional<import("typebox").TString>;
            recommendedActions: import("typebox").TArray<import("typebox").TString>;
        }>>>;
        jobId: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const skillAnalysisResponses: {
    200: import("typebox").TObject<{
        message: import("typebox").TString;
        detectedSkills: import("typebox").TArray<import("typebox").TString>;
        suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>;
        recommendations: import("typebox").TArray<import("typebox").TString>;
        provider: import("typebox").TOptional<import("typebox").TString>;
    }>;
    500: import("typebox").TObject<{
        message: import("typebox").TString;
        detectedSkills: import("typebox").TArray<import("typebox").TString>;
        suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>;
        recommendations: import("typebox").TArray<import("typebox").TString>;
        provider: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
