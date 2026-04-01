import type { MatchJobsResponse } from "./ai-route-contracts";
export declare const runJobMatchingFlow: (resumeId: string | undefined, skills: string[] | undefined) => Promise<MatchJobsResponse>;
