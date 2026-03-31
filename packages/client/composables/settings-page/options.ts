import { AI_PROVIDER_CATALOG } from "@bao/shared/constants/ai-provider";
import {
  APP_LANGUAGE_OPTIONS,
  AUTOMATION_BROWSER_OPTIONS,
  EMAIL_TRANSPORT_AUTH_MODE_OPTIONS,
  EMAIL_TRANSPORT_SECURITY_OPTIONS,
} from "@bao/shared/constants/settings";
import { computed } from "vue";
import type { TranslateFn } from "./shared";
import {
  browserOptionLabel,
  buildLanguageLabel,
  emailTransportAuthModeLabel,
  emailTransportSecurityLabel,
  providerFieldById,
  type ProviderInputConfig,
} from "./shared";

export function createSettingsPageOptionState(t: TranslateFn) {
  const providerInputs = computed<ProviderInputConfig[]>(() =>
    AI_PROVIDER_CATALOG.map((provider) => ({
      id: provider.id,
      label: t(provider.nameKey),
      description: t(provider.descriptionKey),
      field: providerFieldById[provider.id],
    })),
  );

  const languageOptions = computed(() =>
    APP_LANGUAGE_OPTIONS.map((option) => ({
      value: option.value,
      label: buildLanguageLabel(t, option.value),
    })),
  );

  const automationBrowserOptionItems = computed(() =>
    AUTOMATION_BROWSER_OPTIONS.map((browser) => ({
      value: browser,
      label: browserOptionLabel(t, browser),
    })),
  );

  const securityOptionLabels = computed(() =>
    EMAIL_TRANSPORT_SECURITY_OPTIONS.map((security) => ({
      value: security,
      label: emailTransportSecurityLabel(t, security),
    })),
  );

  const authModeOptionLabels = computed(() =>
    EMAIL_TRANSPORT_AUTH_MODE_OPTIONS.map((authMode) => ({
      value: authMode,
      label: emailTransportAuthModeLabel(t, authMode),
    })),
  );

  return {
    providerInputs,
    languageOptions,
    automationBrowserOptionItems,
    securityOptionLabels,
    authModeOptionLabels,
  };
}
