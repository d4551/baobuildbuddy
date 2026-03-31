import { AUTOMATION_SCRAPE_TARGETS, automationScrapeTargetToAction, type AutomationScrapeTarget } from "@bao/shared/constants/automation";
import type { EmailResponseTone } from "@bao/shared/schemas/automation-email.schema";
import { AutomationValidationError } from "./automation-errors";

export interface JobApplyPayload {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers?: Record<string, string>;
}

export interface JobApplyExecutionPayload {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers: Record<string, string>;
}

export interface EmailResponseExecutionPayload {
  subject: string;
  message: string;
  sender?: string;
  tone: EmailResponseTone;
  recipientEmail?: string;
  deliverAfterGeneration: boolean;
}

export interface ScheduledRunMetadata {
  runAt: string;
}

export interface ScrapeExecutionPayload {
  target: AutomationScrapeTarget;
}

const isScrapeTarget = (value: string): value is AutomationScrapeTarget =>
  AUTOMATION_SCRAPE_TARGETS.some((target) => target === value);

const withScheduleMetadata = (
  input: Record<string, unknown>,
  runAt: string,
): Record<string, unknown> => ({
  ...input,
  schedule: { runAt },
});

const parseCustomAnswers = (input: Record<string, unknown> | null): Record<string, string> => {
  if (!input) {
    return {};
  }

  const value = input.customAnswers;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const parsedAnswers: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && entry.length > 0) {
      parsedAnswers[key] = entry;
    }
  }
  return parsedAnswers;
};

export const buildAuditInput = (
  payload: JobApplyExecutionPayload,
  includeAction: boolean,
): Record<string, unknown> => {
  const auditInput: Record<string, unknown> = {
    jobUrl: payload.jobUrl,
    resumeId: payload.resumeId,
    jobId: payload.jobId,
    customAnswers: payload.customAnswers,
  };

  if (payload.coverLetterId) {
    auditInput.coverLetterId = payload.coverLetterId;
  }

  if (includeAction) {
    auditInput.action = "job_apply";
  }

  return auditInput;
};

export const parseScheduledRunMetadata = (
  input: Record<string, unknown> | null,
): ScheduledRunMetadata | null => {
  if (!input) {
    return null;
  }

  const scheduleValue = input.schedule;
  if (!scheduleValue || typeof scheduleValue !== "object" || Array.isArray(scheduleValue)) {
    return null;
  }

  if (!("runAt" in scheduleValue)) {
    return null;
  }

  const runAt = scheduleValue.runAt;
  if (typeof runAt !== "string" || runAt.trim().length === 0) {
    return null;
  }

  return { runAt: runAt.trim() };
};

export const parseScheduledJobApplyPayload = (
  input: Record<string, unknown> | null,
): JobApplyPayload | null => {
  if (!input) {
    return null;
  }

  const jobUrl = typeof input.jobUrl === "string" ? input.jobUrl.trim() : "";
  const resumeId = typeof input.resumeId === "string" ? input.resumeId.trim() : "";
  if (jobUrl.length === 0 || resumeId.length === 0) {
    return null;
  }

  const payload: JobApplyPayload = {
    jobUrl,
    resumeId,
  };

  if (typeof input.coverLetterId === "string" && input.coverLetterId.trim().length > 0) {
    payload.coverLetterId = input.coverLetterId.trim();
  }
  if (typeof input.jobId === "string" && input.jobId.trim().length > 0) {
    payload.jobId = input.jobId.trim();
  }

  const customAnswers = parseCustomAnswers(input);
  if (Object.keys(customAnswers).length > 0) {
    payload.customAnswers = customAnswers;
  }

  return payload;
};

export const buildScheduledJobApplyInput = (
  payload: JobApplyExecutionPayload,
  scheduledFor: string,
): Record<string, unknown> => withScheduleMetadata(buildAuditInput(payload, true), scheduledFor);

export const buildEmailResponseInput = (
  normalized: EmailResponseExecutionPayload,
  options: { includeAction: boolean; scheduledFor?: string },
): Record<string, unknown> => {
  const baseInput: Record<string, unknown> = {
    subject: normalized.subject,
    message: normalized.message,
    tone: normalized.tone,
    deliverAfterGeneration: normalized.deliverAfterGeneration,
    ...(normalized.sender ? { sender: normalized.sender } : {}),
    ...(normalized.recipientEmail ? { recipientEmail: normalized.recipientEmail } : {}),
    ...(options.includeAction ? { action: "email_response" } : {}),
  };

  return options.scheduledFor ? withScheduleMetadata(baseInput, options.scheduledFor) : baseInput;
};

export const parseScheduledEmailResponsePayload = (
  input: Record<string, unknown> | null,
  options: {
    defaultTone: EmailResponseTone;
    isEmailResponseTone: (value: string) => value is EmailResponseTone;
  },
): EmailResponseExecutionPayload | null => {
  if (!input) {
    return null;
  }

  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (subject.length === 0 || message.length === 0) {
    return null;
  }

  const toneCandidate = typeof input.tone === "string" ? input.tone.trim() : "";
  const tone = options.isEmailResponseTone(toneCandidate) ? toneCandidate : options.defaultTone;

  return {
    subject,
    message,
    tone,
    deliverAfterGeneration: input.deliverAfterGeneration === true,
    ...(typeof input.sender === "string" && input.sender.trim().length > 0
      ? { sender: input.sender.trim() }
      : {}),
    ...(typeof input.recipientEmail === "string" && input.recipientEmail.trim().length > 0
      ? { recipientEmail: input.recipientEmail.trim() }
      : {}),
  };
};

export const resolveScrapeAction = (target: AutomationScrapeTarget): string =>
  automationScrapeTargetToAction(target);

export const normalizeScrapeTarget = (target: string): AutomationScrapeTarget => {
  const normalized = target.trim();
  if (!isScrapeTarget(normalized)) {
    throw new AutomationValidationError("target must be a supported scrape target");
  }
  return normalized;
};

export const buildScrapeInput = (
  payload: ScrapeExecutionPayload,
  options: { includeAction: boolean; scheduledFor?: string },
): Record<string, unknown> => {
  const baseInput: Record<string, unknown> = {
    target: payload.target,
    ...(options.includeAction ? { action: resolveScrapeAction(payload.target) } : {}),
  };

  return options.scheduledFor ? withScheduleMetadata(baseInput, options.scheduledFor) : baseInput;
};

export const parseScheduledScrapePayload = (
  input: Record<string, unknown> | null,
): ScrapeExecutionPayload | null => {
  if (!input || typeof input.target !== "string") {
    return null;
  }

  const normalized = input.target.trim();
  if (!isScrapeTarget(normalized)) {
    return null;
  }

  return {
    target: normalized,
  };
};
