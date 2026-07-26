import type { InterviewSession } from "@bao/shared/types/interview";
import type { DBInterviewSession } from "./interview-service-contracts";
export declare function toInterviewSessionFromRow(row: DBInterviewSession): Promise<InterviewSession>;
