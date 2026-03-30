import type { Job } from "@bao/shared";
import type { jobs } from "../../db/schema/jobs";
import type { RawJob } from "./providers/provider-interface";
export declare const rawJobToInsert: (raw: RawJob) => Promise<typeof jobs.$inferInsert>;
export declare const dbRowToJob: (row: typeof jobs.$inferSelect) => Job;
