import {
  isEmailTransportConfigured,
  isValidEmail,
  type RpaRunExecutionEnvelope,
} from "@bao/shared";
import type { Ref } from "vue";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import { formatDateWithLocale } from "~/utils/locale-format";

type EmailResponseTone = "professional" | "friendly" | "concise";

interface EmailFormState {
  subject: string;
  message: string;
  sender: string;
  tone: EmailResponseTone;
  recipientEmail: string;
  deliverAfterGeneration: boolean;
  runAt: string;
}

interface EmailActionResult {
  runId: string;
  reply: string;
  provider: string;
  model: string;
  delivered: boolean;
  recipientEmail?: string;
  deliveredAt?: string;
  messageId?: string;
}
const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;
const EMAIL_TONE_OPTIONS: readonly EmailResponseTone[] = [
  "professional",
  "friendly",
  "concise",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createEmailAutomationForm = () =>
  reactive<EmailFormState>({
    subject: "",
    message: "",
    sender: "",
    tone: "professional",
    recipientEmail: "",
    deliverAfterGeneration: false,
    runAt: "",
  });

const createEmailAutomationResultState = () => ({
  pendingAction: ref<"generate" | "schedule" | null>(null),
  submitError: ref(""),
  lastResult: ref<EmailActionResult | null>(null),
  scheduledRun: ref<RpaRunExecutionEnvelope | null>(null),
});

type EmailAutomationResultState = ReturnType<typeof createEmailAutomationResultState>;

const createResolvedRecipientEmailComputed = (form: EmailFormState) =>
  computed(() => {
    const explicitRecipient = form.recipientEmail.trim();
    if (explicitRecipient.length > 0) {
      return explicitRecipient;
    }

    const sender = form.sender.trim();
    return isValidEmail(sender) ? sender : "";
  });
const createToLocalizedDateTime =
  (localeValue: () => unknown, fallbackLocaleValue: () => unknown) =>
  (value: string): string =>
    formatDateWithLocale(value, localeValue(), fallbackLocaleValue(), DATE_FORMAT_OPTIONS) ?? value;

const resolveScheduledRunAt = (run: RpaRunExecutionEnvelope): string => {
  const runInput = run.input;
  if (!(runInput && isRecord(runInput))) {
    return run.createdAt;
  }
  const scheduleValue = runInput.schedule;
  if (!isRecord(scheduleValue)) {
    return run.createdAt;
  }
  return typeof scheduleValue.runAt === "string" && scheduleValue.runAt.length > 0
    ? scheduleValue.runAt
    : run.createdAt;
};

const toIsoTimestamp = (dateTimeLocal: string): string | null => {
  const parsed = new Date(dateTimeLocal);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
    return null;
  }
  return parsed.toISOString();
};
const resetEmailAutomationResults = (
  submitError: Ref<string>,
  lastResult: Ref<EmailActionResult | null>,
  scheduledRun: Ref<RpaRunExecutionEnvelope | null>,
): void => {
  submitError.value = "";
  lastResult.value = null;
  scheduledRun.value = null;
};

const createBaseEmailPayload = (
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

const createValidateDeliverySettings = (options: {
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

const createSubmitEmailResponse = (options: {
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

const createSubmitScheduledEmailResponse = (options: {
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

const useAutomationEmailSettingsState = async (
  settings: ReturnType<typeof useSettings>["settings"],
  fetchSettings: ReturnType<typeof useSettings>["fetchSettings"],
) => {
  const {
    status: emailSettingsStatus,
    error: emailSettingsError,
    refresh: refreshEmailSettings,
  } = await useAsyncData("automation-email-settings", async () => {
    if (!settings.value) {
      await fetchSettings();
    }
    return true;
  });

  return {
    emailSettingsStatus,
    emailSettingsError,
    refreshEmailSettings,
  };
};

const useAutomationEmailDerivedState = (
  settings: ReturnType<typeof useSettings>["settings"],
  emailSettingsStatus: Ref<"idle" | "pending" | "success" | "error">,
  form: EmailFormState,
) => {
  const emailSettingsPending = computed(
    () => emailSettingsStatus.value === "pending" || emailSettingsStatus.value === "idle",
  );
  const emailDeliveryConfigured = computed(() =>
    isEmailTransportConfigured(
      settings.value?.emailTransportSettings,
      settings.value?.hasEmailTransportPassword ?? false,
    ),
  );
  const resolvedRecipientEmail = createResolvedRecipientEmailComputed(form);
  const canSubmit = computed(
    () => form.subject.trim().length > 0 && form.message.trim().length > 0,
  );

  return {
    emailSettingsPending,
    emailDeliveryConfigured,
    resolvedRecipientEmail,
    canSubmit,
  };
};

const createAutomationEmailPageActions = (options: {
  t: ReturnType<typeof useI18n>["t"];
  form: EmailFormState;
  resultState: EmailAutomationResultState;
  resolvedRecipientEmail: Readonly<Ref<string>>;
  emailDeliveryConfigured: Readonly<Ref<boolean>>;
  triggerEmailResponse: ReturnType<typeof useAutomation>["triggerEmailResponse"];
  scheduleEmailResponse: ReturnType<typeof useAutomation>["scheduleEmailResponse"];
}) => {
  const validateDeliverySettings = createValidateDeliverySettings({
    t: options.t,
    form: options.form,
    submitError: options.resultState.submitError,
    emailDeliveryConfigured: options.emailDeliveryConfigured,
    resolvedRecipientEmail: options.resolvedRecipientEmail,
  });

  return {
    submitEmailResponse: createSubmitEmailResponse({
      t: options.t,
      form: options.form,
      resultState: options.resultState,
      resolvedRecipientEmail: options.resolvedRecipientEmail,
      validateDeliverySettings,
      triggerEmailResponse: options.triggerEmailResponse,
    }),
    submitScheduledEmailResponse: createSubmitScheduledEmailResponse({
      t: options.t,
      form: options.form,
      resultState: options.resultState,
      resolvedRecipientEmail: options.resolvedRecipientEmail,
      validateDeliverySettings,
      scheduleEmailResponse: options.scheduleEmailResponse,
    }),
  };
};

const buildAutomationEmailPageState = async () => {
  const { t, locale, fallbackLocale } = useI18n();
  const { triggerEmailResponse, scheduleEmailResponse } = useAutomation();
  const { settings, fetchSettings } = useSettings();
  const form = createEmailAutomationForm();
  const resultState = createEmailAutomationResultState();
  const { emailSettingsStatus, emailSettingsError, refreshEmailSettings } =
    await useAutomationEmailSettingsState(settings, fetchSettings);
  const derivedState = useAutomationEmailDerivedState(settings, emailSettingsStatus, form);
  const actions = createAutomationEmailPageActions({
    t,
    form,
    resultState,
    resolvedRecipientEmail: derivedState.resolvedRecipientEmail,
    emailDeliveryConfigured: derivedState.emailDeliveryConfigured,
    triggerEmailResponse,
    scheduleEmailResponse,
  });

  return {
    t,
    locale,
    fallbackLocale,
    form,
    resultState,
    emailSettingsStatus,
    emailSettingsError,
    refreshEmailSettings,
    derivedState,
    actions,
  };
};
export async function useAutomationEmailPage() {
  const state = await buildAutomationEmailPageState();
  const pending = computed(() => state.resultState.pendingAction.value !== null);
  const toLocalizedDateTime = createToLocalizedDateTime(
    () => state.locale.value,
    () => state.fallbackLocale.value,
  );

  return {
    t: state.t,
    form: state.form,
    toneOptions: EMAIL_TONE_OPTIONS,
    pendingAction: state.resultState.pendingAction,
    submitError: state.resultState.submitError,
    lastResult: state.resultState.lastResult,
    scheduledRun: state.resultState.scheduledRun,
    emailSettingsStatus: state.emailSettingsStatus,
    emailSettingsError: state.emailSettingsError,
    refreshEmailSettings: state.refreshEmailSettings,
    emailSettingsPending: state.derivedState.emailSettingsPending,
    emailDeliveryConfigured: state.derivedState.emailDeliveryConfigured,
    pending,
    canSubmit: state.derivedState.canSubmit,
    toLocalizedDateTime,
    resolveScheduledRunAt,
    submitEmailResponse: state.actions.submitEmailResponse,
    submitScheduledEmailResponse: state.actions.submitScheduledEmailResponse,
  };
}
