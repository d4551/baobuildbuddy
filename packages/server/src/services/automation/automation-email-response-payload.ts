import type { EmailResponseRequest, EmailResponseTone } from "@bao/shared";
import {
  AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH,
  isValidEmail,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared";
import { AutomationValidationError } from "./automation-errors";
import type { EmailResponseExecutionPayload } from "./automation-run-inputs";

const MAX_EMAIL_SUBJECT_LENGTH = SCHEMA_MAX_LENGTH_SHORT;
const MAX_EMAIL_SENDER_LENGTH = SCHEMA_MAX_LENGTH_SHORT;

export const DEFAULT_EMAIL_RESPONSE_TONE: EmailResponseTone = "professional";

const EMAIL_RESPONSE_TONES: readonly EmailResponseTone[] = [
  "professional",
  "friendly",
  "concise",
] as const;

export const isEmailResponseTone = (value: string): value is EmailResponseTone =>
  EMAIL_RESPONSE_TONES.some((tone) => tone === value);

const validateEmailResponseTextLengths = (
  subject: string,
  message: string,
  sender?: string,
): void => {
  if (subject.length === 0 || subject.length > MAX_EMAIL_SUBJECT_LENGTH) {
    throw new AutomationValidationError(
      `subject is required and must be <= ${MAX_EMAIL_SUBJECT_LENGTH} characters`,
    );
  }

  if (message.length === 0 || message.length > AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH) {
    throw new AutomationValidationError(
      `message is required and must be <= ${AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH} characters`,
    );
  }

  if (sender && sender.length > MAX_EMAIL_SENDER_LENGTH) {
    throw new AutomationValidationError(`sender must be <= ${MAX_EMAIL_SENDER_LENGTH} characters`);
  }
};

const resolveRecipientEmail = (
  sender: string | undefined,
  explicitRecipient: string | undefined,
  deliverAfterGeneration: boolean,
): string | undefined => {
  if (explicitRecipient && !isValidEmail(explicitRecipient)) {
    throw new AutomationValidationError("recipientEmail must be a valid email address");
  }

  const inferredRecipient = sender && isValidEmail(sender) ? sender : undefined;
  const recipientEmail = explicitRecipient || inferredRecipient;
  if (deliverAfterGeneration && !recipientEmail) {
    throw new AutomationValidationError("recipientEmail is required when delivery is enabled");
  }

  return recipientEmail;
};

const normalizeTone = (toneValue: EmailResponseRequest["tone"]): EmailResponseTone => {
  const normalizedTone = toneValue?.trim();
  if (normalizedTone && isEmailResponseTone(normalizedTone)) {
    return normalizedTone;
  }

  return DEFAULT_EMAIL_RESPONSE_TONE;
};

export const normalizeEmailResponsePayload = (
  payload: EmailResponseRequest,
): EmailResponseExecutionPayload => {
  const subject = payload.subject?.trim() ?? "";
  const message = payload.message?.trim() ?? "";
  const sender = payload.sender?.trim();
  const explicitRecipient = payload.recipientEmail?.trim();
  const deliverAfterGeneration = payload.deliverAfterGeneration === true;

  validateEmailResponseTextLengths(subject, message, sender);

  const recipientEmail = resolveRecipientEmail(sender, explicitRecipient, deliverAfterGeneration);
  const tone = normalizeTone(payload.tone);

  return {
    subject,
    message,
    tone,
    deliverAfterGeneration,
    ...(sender ? { sender } : {}),
    ...(recipientEmail ? { recipientEmail } : {}),
  };
};
