import type { InterviewSession } from "@bao/shared";
import type { DBInterviewSession } from "./interview-service-contracts";
export declare function toInterviewSession(row: DBInterviewSession): Promise<InterviewSession>;
