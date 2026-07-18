import { isEmailTransportConfigured } from "@bao/shared/utils/email-transport";
import type { Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  createEmailAutomationForm,
  createEmailAutomationResultState,
  createResolvedRecipientEmailComputed,
  createSubmitEmailResponse,
  createSubmitScheduledEmailResponse,
  createToLocalizedDateTime,
  createValidateDeliverySettings,
  EMAIL_TONE_OPTIONS,
  type EmailAutomationResultState,
  type EmailFormState,
  resolveScheduledRunAt,
} from "~/composables/automation-email-page-form";

const useAutomationEmailSettingsState = (
  settings: ReturnType<typeof useSettings>["settings"],
  fetchSettings: ReturnType<typeof useSettings>["fetchSettings"],
) => {
  const {
    status: emailSettingsStatus,
    error: emailSettingsError,
    refresh: refreshEmailSettings,
  } = useAsyncData("automation-email-settings", async () => {
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

const buildAutomationEmailPageState = () => {
  const { t, locale, fallbackLocale } = useI18n();
  const { triggerEmailResponse, scheduleEmailResponse } = useAutomation();
  const { settings, fetchSettings } = useSettings();
  const form = createEmailAutomationForm();
  const resultState = createEmailAutomationResultState();
  const { emailSettingsStatus, emailSettingsError, refreshEmailSettings } =
    useAutomationEmailSettingsState(settings, fetchSettings);
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

export function useAutomationEmailPage() {
  const state = buildAutomationEmailPageState();
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
