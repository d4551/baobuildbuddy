import { jobs } from "../db/schema/jobs";
type JobRow = typeof jobs.$inferSelect;
type JobRecommendation = JobRow & {
    matchScore: number;
    matchReason: string;
    rank: number;
};
export type JobRecommendationsResponse = {
    recommendations: JobRecommendation[];
    reason: string;
    aiPowered: boolean;
    provider?: string;
};
export declare const getRecommendations: () => Promise<JobRecommendationsResponse>;
export {};
