import type { EmailResponseRequest, EmailResponseTone } from "@bao/shared/schemas/automation-email.schema";
import type { EmailResponseExecutionPayload } from "./automation-run-inputs";
export declare const DEFAULT_EMAIL_RESPONSE_TONE: EmailResponseTone;
export declare const isEmailResponseTone: (value: string) => value is EmailResponseTone;
export declare const normalizeEmailResponsePayload: (payload: EmailResponseRequest) => EmailResponseExecutionPayload;
