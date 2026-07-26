import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { isValidEmail } from "@bao/shared/utils/validation";
import type { Ref } from "vue";
import type { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { DATE_FORMAT_OPTIONS, toIsoTimestamp } from "~/composables/schedule-timestamp";
import { getErrorMessage } from "~/utils/errors";
import { formatDateWithLocale } from "~/utils/locale-format";

export type EmailResponseTone = "professional" | "friendly" | "concise";

export interface EmailFormState {
  subject: string;
  message: string;
  sender: string;
  tone: EmailResponseTone;
  recipientEmail: string;
  deliverAfterGeneration: boolean;
  runAt: string;
}

export interface EmailActionResult {
  runId: string;
  reply: string;
  provider: string;
  model: string;
  delivered: boolean;
  recipientEmail?: string;
  deliveredAt?: string;
  messageId?: string;
}
export const EMAIL_TONE_OPTIONS: readonly EmailResponseTone[] = [
  "professional",
  "friendly",
  "concise",
] as const;

export const createEmailAutomationForm = () =>
  reactive<EmailFormState>({
    subject: "",
    message: "",
    sender: "",
    tone: "professional",
    recipientEmail: "",
    deliverAfterGeneration: false,
    runAt: "",
  });

export const createEmailAutomationResultState = () => ({
  pendingAction: ref<"generate" | "schedule" | null>(null),
  submitError: ref(""),
  lastResult: ref<EmailActionResult | null>(null),
  scheduledRun: ref<RpaRunExecutionEnvelope | null>(null),
});

export type EmailAutomationResultState = ReturnType<typeof createEmailAutomationResultState>;

export const createResolvedRecipientEmailComputed = (form: EmailFormState) =>
  computed(() => {
    const explicitRecipient = form.recipientEmail.trim();
    if (explicitRecipient.length > 0) {
      return explicitRecipient;
    }

    const sender = form.sender.trim();
    return isValidEmail(sender) ? sender : "";
  });
export const createToLocalizedDateTime =
  (localeValue: () => unknown, fallbackLocaleValue: () => unknown) =>
  (value: string): string =>
    formatDateWithLocale(value, localeValue(), fallbackLocaleValue(), DATE_FORMAT_OPTIONS) ?? value;

export const resetEmailAutomationResults = (
  submitError: Ref<string>,
  lastResult: Ref<EmailActionResult | null>,
  scheduledRun: Ref<RpaRunExecutionEnvelope | null>,
): void => {
  submitError.value = "";
  lastResult.value = null;
  scheduledRun.value = null;
};

export const createBaseEmailPayload = (
  form: EmailFormState,
  resolvedRecipientEmail: Readonly<Ref<string>>,
) => ({
  subject: form.subject.trim(),
  message: form.message.trim(),
  tone: form.tone,
  ...(form.sender.trim() ? { sender: form.sender.trim() } : {}),
  ...(resolvedRecipientEmail.value ? { recipientEmail: resolvedRecipientEmail.value } : {}),
  deliverAfterGeneration: form.deliverAfterGeneration,
});

export const createValidateDeliverySettings = (options: {
  t: ReturnType<typeof useI18n>["t"];
  form: EmailFormState;
  submitError: Ref<string>;
  emailDeliveryConfigured: Readonly<Ref<boolean>>;
  resolvedRecipientEmail: Readonly<Ref<string>>;
}) => {
  return (): boolean => {
    if (!options.form.deliverAfterGeneration) return true;
    if (!options.emailDeliveryConfigured.value) {
      options.submitError.value = options.t("automation.email.deliveryUnavailableDescription");
      return false;
    }
    if (!isValidEmail(options.resolvedRecipientEmail.value)) {
      options.submitError.value = options.t("automation.email.invalidRecipient");
      return false;
    }
    return true;
  };
};

export const createSubmitEmailResponse = (options: {
  t: ReturnType<typeof useI18n>["t"];
  form: EmailFormState;
  resultState: EmailAutomationResultState;
  resolvedRecipientEmail: Readonly<Ref<string>>;
  validateDeliverySettings: () => boolean;
  triggerEmailResponse: ReturnType<typeof useAutomation>["triggerEmailResponse"];
}) => {
  return async (): Promise<void> => {
    resetEmailAutomationResults(
      options.resultState.submitError,
      options.resultState.lastResult,
      options.resultState.scheduledRun,
    );

    if (!options.validateDeliverySettings()) {
      return;
    }

    options.resultState.pendingAction.value = "generate";
    const responseResult = await settlePromise(
      options.triggerEmailResponse(
        createBaseEmailPayload(options.form, options.resolvedRecipientEmail),
      ),
      options.t("automation.email.submitErrorFallback"),
    );
    options.resultState.pendingAction.value = null;

    if (!responseResult.ok) {
      options.resultState.submitError.value = getErrorMessage(
        responseResult.error,
        options.t("automation.email.submitErrorFallback"),
      );
      return;
    }

    const response = responseResult.value;
    options.resultState.lastResult.value = {
      runId: response.runId,
      reply: response.reply,
      provider: response.provider,
      model: response.model,
      delivered: response.delivered,
      recipientEmail: response.recipientEmail,
      deliveredAt: response.deliveredAt,
      messageId: response.messageId,
    };
  };
};

export const createSubmitScheduledEmailResponse = (options: {
  t: ReturnType<typeof useI18n>["t"];
  form: EmailFormState;
  resultState: EmailAutomationResultState;
  resolvedRecipientEmail: Readonly<Ref<string>>;
  validateDeliverySettings: () => boolean;
  scheduleEmailResponse: ReturnType<typeof useAutomation>["scheduleEmailResponse"];
}) => {
  return async (): Promise<void> => {
    resetEmailAutomationResults(
      options.resultState.submitError,
      options.resultState.lastResult,
      options.resultState.scheduledRun,
    );

    if (!options.validateDeliverySettings()) {
      return;
    }

    const runAt = toIsoTimestamp(options.form.runAt);
    if (!runAt) {
      options.resultState.submitError.value = options.t("automation.email.schedule.invalidRunAt");
      return;
    }

    options.resultState.pendingAction.value = "schedule";
    const scheduleResult = await settlePromise(
      options.scheduleEmailResponse({
        ...createBaseEmailPayload(options.form, options.resolvedRecipientEmail),
        runAt,
      }),
      options.t("automation.email.submitErrorFallback"),
    );
    options.resultState.pendingAction.value = null;

    if (!scheduleResult.ok) {
      options.resultState.submitError.value = getErrorMessage(
        scheduleResult.error,
        options.t("automation.email.submitErrorFallback"),
      );
      return;
    }

    options.resultState.scheduledRun.value = scheduleResult.value;
  };
};
