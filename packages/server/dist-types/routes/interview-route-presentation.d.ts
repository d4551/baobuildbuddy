import type { InterviewSession } from "@bao/shared/types/interview";
import type { SessionPayload } from "./interview-route-contracts";
export declare const sessionWithDerivedFields: (session: InterviewSession) => Promise<SessionPayload>;
