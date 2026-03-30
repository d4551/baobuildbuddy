import type { EmailResponseResult } from "@bao/shared";
import {
  API_ERROR_EMAIL_DELIVERY_FAILED,
  API_ERROR_EMPTY_EMAIL_RESPONSE,
  API_ERROR_GENERATE_EMAIL_RESPONSE,
  API_ERROR_NO_AI_PROVIDER_EMAIL,
  API_MESSAGE_EMAIL_RESPONSE_DELIVERED,
  API_MESSAGE_EMAIL_RESPONSE_GENERATED,
  AUTOMATION_FINISHED_PROGRESS,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { emailResponsePrompt } from "../ai/prompts";
import { emailDeliveryService, type EmailTransportRuntimeConfig } from "../email-delivery-service";
import type { AIService } from "../ai/ai-service";
import type { EmailResponseExecutionPayload } from "./automation-run-inputs";
import { buildEmailResponseInput } from "./automation-run-inputs";
import type {
  BroadcastProgressEvent,
  CreateProgressEvent,
  EmailDeliveryDetails,
} from "./automation-service-contracts";

type EmailGenerationResult = { reply: string; provider: string; model: string };

interface EmailResponseRuntime {
  loadAIService: () => Promise<AIService | null>;
  loadEmailTransportConfig: () => Promise<EmailTransportRuntimeConfig>;
  createProgressEvent: CreateProgressEvent;
  broadcastProgressEvent: BroadcastProgressEvent;
}

export const createEmailResponseRun = async (
  runId: string,
  normalized: EmailResponseExecutionPayload,
  options: { status: "running" | "pending"; scheduledFor?: string } = { status: "running" },
): Promise<void> => {
  const now = new Date().toISOString();
  const totalSteps = normalized.deliverAfterGeneration ? 2 : 1;
  await db.insert(automationRuns).values({
    id: runId,
    type: "email",
    status: options.status,
    jobId: null,
    userId: null,
    input: buildEmailResponseInput(normalized, {
      includeAction: options.status === "pending",
      scheduledFor: options.scheduledFor,
    }),
    progress: 0,
    currentStep: options.status === "running" ? 0 : null,
    totalSteps: options.status === "running" ? totalSteps : null,
    exitCode: 0,
    timedOut: false,
    aborted: false,
    executionMs: null,
    startedAt: options.status === "running" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
};

export const markEmailResponseRunStarted = async (
  runId: string,
  normalized: EmailResponseExecutionPayload,
): Promise<void> => {
  const totalSteps = normalized.deliverAfterGeneration ? 2 : 1;
  const startedAt = new Date().toISOString();
  await db
    .update(automationRuns)
    .set({
      status: "running",
      input: buildEmailResponseInput(normalized, { includeAction: false }),
      progress: 0,
      currentStep: 0,
      totalSteps,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt,
      completedAt: null,
      updatedAt: startedAt,
    })
    .where(eq(automationRuns.id, runId));
};

const failEmailResponseRun = async (
  runId: string,
  error: unknown,
  runtime: Pick<EmailResponseRuntime, "broadcastProgressEvent" | "createProgressEvent">,
  partialResult?: EmailGenerationResult,
): Promise<never> => {
  const message = toErrorMessage(
    error,
    partialResult ? API_ERROR_EMAIL_DELIVERY_FAILED : API_ERROR_GENERATE_EMAIL_RESPONSE,
  );
  const completedAt = new Date().toISOString();
  await db
    .update(automationRuns)
    .set({
      status: "error",
      output: {
        success: false,
        error: message,
        ...(partialResult
          ? {
              reply: partialResult.reply,
              provider: partialResult.provider,
              model: partialResult.model,
              delivered: false,
            }
          : {}),
      },
      error: message,
      progress: AUTOMATION_FINISHED_PROGRESS,
      currentStep: partialResult ? 2 : 1,
      totalSteps: partialResult ? 2 : 1,
      completedAt,
      updatedAt: completedAt,
    })
    .where(eq(automationRuns.id, runId));
  runtime.broadcastProgressEvent(
    runtime.createProgressEvent({
      runId,
      action: "email_response",
      status: "error",
      message,
      step: partialResult ? 2 : 1,
      totalSteps: partialResult ? 2 : 1,
    }),
  );
  throw error instanceof Error ? error : new Error(message);
};

const generateEmailResponse = async (
  normalized: EmailResponseExecutionPayload,
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

const markEmailResponseDraftGenerated = async (
  runId: string,
  result: EmailGenerationResult,
  runtime: Pick<EmailResponseRuntime, "broadcastProgressEvent" | "createProgressEvent">,
  recipientEmail?: string,
): Promise<void> => {
  const updatedAt = new Date().toISOString();
  await db
    .update(automationRuns)
    .set({
      output: {
        success: true,
        reply: result.reply,
        provider: result.provider,
        model: result.model,
        delivered: false,
        ...(recipientEmail ? { recipientEmail } : {}),
      },
      progress: Math.round(AUTOMATION_FINISHED_PROGRESS / 2),
      currentStep: 1,
      totalSteps: 2,
      updatedAt,
    })
    .where(eq(automationRuns.id, runId));
  runtime.broadcastProgressEvent(
    runtime.createProgressEvent({
      runId,
      action: "email_response",
      status: "running",
      message: API_MESSAGE_EMAIL_RESPONSE_GENERATED,
      step: 1,
      totalSteps: 2,
    }),
  );
};

const deliverGeneratedEmail = async (
  normalized: EmailResponseExecutionPayload,
  reply: string,
  loadEmailTransportConfig: EmailResponseRuntime["loadEmailTransportConfig"],
): Promise<EmailDeliveryDetails> => {
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

const completeEmailResponseRun = async (
  runId: string,
  result: {
    reply: string;
    provider: string;
    model: string;
    delivery: EmailDeliveryDetails;
  },
  runtime: Pick<EmailResponseRuntime, "broadcastProgressEvent" | "createProgressEvent">,
): Promise<void> => {
  const completedAt = new Date().toISOString();
  await db
    .update(automationRuns)
    .set({
      status: "success",
      output: {
        success: true,
        reply: result.reply,
        provider: result.provider,
        model: result.model,
        delivered: result.delivery.delivered,
        ...(result.delivery.recipientEmail ? { recipientEmail: result.delivery.recipientEmail } : {}),
        ...(result.delivery.deliveredAt ? { deliveredAt: result.delivery.deliveredAt } : {}),
        ...(result.delivery.messageId ? { messageId: result.delivery.messageId } : {}),
      },
      error: null,
      progress: AUTOMATION_FINISHED_PROGRESS,
      currentStep: result.delivery.delivered ? 2 : 1,
      totalSteps: result.delivery.delivered ? 2 : 1,
      completedAt,
      updatedAt: completedAt,
    })
    .where(eq(automationRuns.id, runId));
  runtime.broadcastProgressEvent(
    runtime.createProgressEvent({
      runId,
      action: "email_response",
      status: "success",
      message: result.delivery.delivered
        ? API_MESSAGE_EMAIL_RESPONSE_DELIVERED
        : API_MESSAGE_EMAIL_RESPONSE_GENERATED,
      step: result.delivery.delivered ? 2 : 1,
      totalSteps: result.delivery.delivered ? 2 : 1,
    }),
  );
};

export const executeEmailResponseRun = async (
  runId: string,
  normalized: EmailResponseExecutionPayload,
  runtime: EmailResponseRuntime,
): Promise<EmailResponseResult> => {
  const responseResult = await settle(generateEmailResponse(normalized, runtime.loadAIService));
  if (responseResult.status === "rejected") {
    return failEmailResponseRun(runId, responseResult.reason, runtime);
  }

  if (normalized.deliverAfterGeneration) {
    await markEmailResponseDraftGenerated(
      runId,
      responseResult.value,
      runtime,
      normalized.recipientEmail,
    );
  }

  const noDelivery: EmailDeliveryDetails = {
    delivered: false,
    ...(normalized.recipientEmail ? { recipientEmail: normalized.recipientEmail } : {}),
  };
  const deliveryResult: PromiseSettledResult<EmailDeliveryDetails> =
    normalized.deliverAfterGeneration
      ? await settle(
          deliverGeneratedEmail(normalized, responseResult.value.reply, runtime.loadEmailTransportConfig),
        )
      : { status: "fulfilled", value: noDelivery };

  if (deliveryResult.status === "rejected") {
    return failEmailResponseRun(runId, deliveryResult.reason, runtime, responseResult.value);
  }

  await completeEmailResponseRun(
    runId,
    {
      ...responseResult.value,
      delivery: deliveryResult.value,
    },
    runtime,
  );
  return {
    runId,
    status: "success",
    ...responseResult.value,
    delivered: deliveryResult.value.delivered,
    ...(deliveryResult.value.recipientEmail ? { recipientEmail: deliveryResult.value.recipientEmail } : {}),
    ...(deliveryResult.value.deliveredAt ? { deliveredAt: deliveryResult.value.deliveredAt } : {}),
    ...(deliveryResult.value.messageId ? { messageId: deliveryResult.value.messageId } : {}),
  };
};
