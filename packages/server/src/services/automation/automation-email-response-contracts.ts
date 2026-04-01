import type { EmailResponseResult } from "@bao/shared/schemas/automation-email.schema";
import type { AIService } from "../ai/ai-service";
import type { EmailTransportRuntimeConfig } from "../email-delivery-service";
import type { EmailResponseExecutionPayload } from "./automation-run-inputs";
import type {
  BroadcastProgressEvent,
  CreateProgressEvent,
  EmailDeliveryDetails,
} from "./automation-service-contracts";

export type EmailGenerationResult = { reply: string; provider: string; model: string };

export interface EmailResponseRuntime {
  loadAIService: () => Promise<AIService | null>;
  loadEmailTransportConfig: () => Promise<EmailTransportRuntimeConfig>;
  createProgressEvent: CreateProgressEvent;
  broadcastProgressEvent: BroadcastProgressEvent;
}

export type EmailExecutionResult = EmailResponseResult;
export type EmailResponsePayload = EmailResponseExecutionPayload;
export type EmailDeliveryResult = EmailDeliveryDetails;
