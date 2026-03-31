import {
  API_ERROR_EMPTY_EMAIL_RESPONSE,
  API_ERROR_NO_AI_PROVIDER_EMAIL,
} from "@bao/shared/constants/api-errors";
import { settle } from "@bao/shared/utils/promise";
import { emailResponsePrompt } from "../ai/prompts-career";
import { emailDeliveryService } from "../email-delivery-service";
import type {
  EmailDeliveryResult,
  EmailGenerationResult,
  EmailResponsePayload,
  EmailResponseRuntime,
} from "./automation-email-response-contracts";

export const generateEmailResponse = async (
  normalized: EmailResponsePayload,
  loadAIService: EmailResponseRuntime["loadAIService"],
): Promise<EmailGenerationResult> => {
  const aiService = await loadAIService();
  if (!aiService) {
    throw new Error(API_ERROR_NO_AI_PROVIDER_EMAIL);
  }

  const aiResultOutcome = await settle(
    aiService.generate(
      emailResponsePrompt(
        normalized.subject,
        normalized.message,
        normalized.tone,
        normalized.sender,
      ),
      { purpose: "emailResponse" },
    ),
  );
  if (aiResultOutcome.status === "rejected") {
    throw aiResultOutcome.reason;
  }

  const aiResult = aiResultOutcome.value;
  const reply = aiResult.content.trim();
  if (reply.length === 0) {
    throw new Error(API_ERROR_EMPTY_EMAIL_RESPONSE);
  }

  return { reply, provider: aiResult.provider, model: aiResult.model };
};

export const deliverGeneratedEmail = async (
  normalized: EmailResponsePayload,
  reply: string,
  loadEmailTransportConfig: EmailResponseRuntime["loadEmailTransportConfig"],
): Promise<EmailDeliveryResult> => {
  if (!normalized.recipientEmail) {
    throw new Error("recipientEmail is required for email delivery");
  }

  const deliveryConfig = await loadEmailTransportConfig();
  const deliveryResult = await emailDeliveryService.send(deliveryConfig, {
    recipientEmail: normalized.recipientEmail,
    subject: normalized.subject,
    body: reply,
  });

  return {
    delivered: true,
    recipientEmail: deliveryResult.recipientEmail,
    deliveredAt: deliveryResult.deliveredAt,
    messageId: deliveryResult.messageId,
  };
};
