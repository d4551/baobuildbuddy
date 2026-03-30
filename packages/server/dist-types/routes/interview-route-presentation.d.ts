import type { InterviewSession } from "@bao/shared";
import type { SessionPayload } from "./interview-route-contracts";
export declare const sessionWithDerivedFields: (session: InterviewSession) => Promise<SessionPayload>;
