import type { EmailDeliveryResult, EmailGenerationResult, EmailResponsePayload, EmailResponseRuntime } from "./automation-email-response-contracts";
export declare const generateEmailResponse: (normalized: EmailResponsePayload, loadAIService: EmailResponseRuntime["loadAIService"]) => Promise<EmailGenerationResult>;
export declare const deliverGeneratedEmail: (normalized: EmailResponsePayload, reply: string, loadEmailTransportConfig: EmailResponseRuntime["loadEmailTransportConfig"]) => Promise<EmailDeliveryResult>;
