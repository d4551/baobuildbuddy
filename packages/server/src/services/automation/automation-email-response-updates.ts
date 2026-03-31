import {
  API_ERROR_EMAIL_DELIVERY_FAILED,
  API_ERROR_GENERATE_EMAIL_RESPONSE,
  API_MESSAGE_EMAIL_RESPONSE_DELIVERED,
  API_MESSAGE_EMAIL_RESPONSE_GENERATED,
  AUTOMATION_FINISHED_PROGRESS,
  toErrorMessage,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import type {
  EmailDeliveryResult,
  EmailGenerationResult,
  EmailResponseRuntime,
} from "./automation-email-response-contracts";

export const failEmailResponseRun = async (
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

export const markEmailResponseDraftGenerated = async (
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

export const completeEmailResponseRun = async (
  runId: string,
  result: {
    reply: string;
    provider: string;
    model: string;
    delivery: EmailDeliveryResult;
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
        ...(result.delivery.recipientEmail
          ? { recipientEmail: result.delivery.recipientEmail }
          : {}),
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
