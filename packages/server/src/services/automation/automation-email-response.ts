import {
  settle,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import type { EmailResponseExecutionPayload } from "./automation-run-inputs";
import { buildEmailResponseInput } from "./automation-run-inputs";
import type {
  EmailDeliveryResult,
  EmailExecutionResult,
  EmailResponseRuntime,
} from "./automation-email-response-contracts";
import {
  deliverGeneratedEmail,
  generateEmailResponse,
} from "./automation-email-response-delivery";
import {
  completeEmailResponseRun,
  failEmailResponseRun,
  markEmailResponseDraftGenerated,
} from "./automation-email-response-updates";

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

export const executeEmailResponseRun = async (
  runId: string,
  normalized: EmailResponseExecutionPayload,
  runtime: EmailResponseRuntime,
): Promise<EmailExecutionResult> => {
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

  const noDelivery: EmailDeliveryResult = {
    delivered: false,
    ...(normalized.recipientEmail ? { recipientEmail: normalized.recipientEmail } : {}),
  };
  const deliveryResult: PromiseSettledResult<EmailDeliveryResult> =
    normalized.deliverAfterGeneration
      ? await settle(
          deliverGeneratedEmail(normalized, responseResult.value.reply, runtime.loadEmailTransportConfig),
        )
      : await settle(Promise.resolve(noDelivery));

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
