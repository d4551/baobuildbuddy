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
  type ProviderInputConfig,
  providerFieldById,
} from "./shared";

export function createSettingsPageOptionState(t: TranslateFn) {
  const providerInputs = computed<ProviderInputConfig[]>(() => {
    const inputs: ProviderInputConfig[] = [];
    for (const catalogEntry of AI_PROVIDER_CATALOG) {
      inputs.push({
        id: catalogEntry.id,
        label: t(catalogEntry.nameKey),
        description: t(catalogEntry.descriptionKey),
        field: providerFieldById[catalogEntry.id],
      });
    }
    return inputs;
  });

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
