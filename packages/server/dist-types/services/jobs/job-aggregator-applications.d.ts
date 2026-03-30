import { applications } from "../../db/schema/jobs";
import type { Job } from "@bao/shared";
export declare const applyToJob: (jobId: string, notes?: string) => Promise<string>;
export declare const getApplications: () => Promise<Array<typeof applications.$inferSelect & {
    job: Job;
}>>;
export declare const updateApplicationStatus: (applicationId: string, status: string, note?: string) => Promise<void>;
