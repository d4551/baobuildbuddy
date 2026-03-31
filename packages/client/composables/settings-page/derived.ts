import { resolveBrandSettings } from "@bao/shared/constants/branding";
import {
  brandContentSettingsSchema,
  brandThemePaletteSchema,
} from "@bao/shared/schemas/settings.schema";
import { AI_ROUTING_PURPOSE_IDS, type AIProviderType } from "@bao/shared/types/ai";
import type {
  AppSettings,
  BrandSettings,
  EmailTransportSettings,
} from "@bao/shared/types/settings-contracts";
import { isEmailTransportConfigured } from "@bao/shared/utils/email-transport";
import { parseJson } from "@bao/shared/utils/json";
import { computed } from "vue";
import { resolveLocalProviderState, resolveProviderModelOptions } from "~/utils/ai-control-plane";
import type { AIRoutingDraft, TranslateFn } from "./shared";

type DerivedStateInput = {
  t: TranslateFn;
  settings: {
    value: AppSettings | null;
  };
  emailTransportForm: EmailTransportSettings;
  aiRoutingDraft: AIRoutingDraft;
  apiKeys: {
    localModelEndpoint: string;
    localModelName: string;
  };
  brandForm: {
    name: string;
    assistantName: string;
    apiName: string;
    logoPath: string;
    faviconPath: string;
    fontStylesheetUrl: string;
    displayFontFamily: string;
    bodyFontFamily: string;
    monoFontFamily: string;
    tagline: string;
    defaultTitle: string;
    defaultDescription: string;
    lightThemeJson: string;
    darkThemeJson: string;
    contentOverridesJson: string;
  };
  brandDefaults: BrandSettings;
};

function createEmailDeliveryConfigured(input: DerivedStateInput) {
  return computed(() =>
    isEmailTransportConfigured(
      input.settings.value?.emailTransportSettings ?? input.emailTransportForm,
      input.settings.value?.hasEmailTransportPassword ?? false,
    ),
  );
}

function createLocalProviderDraftState(input: DerivedStateInput) {
  return computed(() =>
    resolveLocalProviderState({
      settings: input.settings.value,
      endpoint: input.apiKeys.localModelEndpoint,
      model: input.apiKeys.localModelName,
    }),
  );
}

function createAiRoutingSections(input: DerivedStateInput) {
  return computed(() =>
    AI_ROUTING_PURPOSE_IDS.map((purpose) => ({
      id: purpose,
      label: input.t(`settings.aiProviders.purposes.${purpose}.label`),
      description: input.t(`settings.aiProviders.purposes.${purpose}.description`),
    })),
  );
}

function resolveRoutingOptions(input: DerivedStateInput, provider: AIProviderType): string[] {
  return resolveProviderModelOptions(
    provider,
    input.settings.value,
    provider === "local" ? [input.apiKeys.localModelName] : [],
  );
}

function createRoutingModelOptions(input: DerivedStateInput) {
  return computed(() => ({
    chat: resolveRoutingOptions(input, input.aiRoutingDraft.chat.provider),
    interviewQuestions: resolveRoutingOptions(
      input,
      input.aiRoutingDraft.interviewQuestions.provider,
    ),
    interviewFeedback: resolveRoutingOptions(
      input,
      input.aiRoutingDraft.interviewFeedback.provider,
    ),
    resume: resolveRoutingOptions(input, input.aiRoutingDraft.resume.provider),
    coverLetter: resolveRoutingOptions(input, input.aiRoutingDraft.coverLetter.provider),
    emailResponse: resolveRoutingOptions(input, input.aiRoutingDraft.emailResponse.provider),
    jobMatch: resolveRoutingOptions(input, input.aiRoutingDraft.jobMatch.provider),
    scrapeEnrichment: resolveRoutingOptions(input, input.aiRoutingDraft.scrapeEnrichment.provider),
    automationFieldMapping: resolveRoutingOptions(
      input,
      input.aiRoutingDraft.automationFieldMapping.provider,
    ),
  }));
}

function createProviderConfiguredById(input: DerivedStateInput) {
  return computed(() => {
    const current = input.settings.value;
    if (!current) {
      return {
        local: false,
        gemini: false,
        openai: false,
        claude: false,
        huggingface: false,
      };
    }

    return {
      local: current.hasLocalKey ?? true,
      gemini: Boolean(current.hasGeminiKey),
      openai: Boolean(current.hasOpenaiKey),
      claude: Boolean(current.hasClaudeKey),
      huggingface: Boolean(current.hasHuggingfaceToken),
    };
  });
}

function parseBrandContentOverrides(input: DerivedStateInput): Record<string, string> {
  return (
    parseJson(
      input.brandForm.contentOverridesJson,
      brandContentSettingsSchema.shape.contentOverrides,
    ) ?? {}
  );
}

function createBrandDraft(input: DerivedStateInput) {
  return computed<BrandSettings>(() =>
    resolveBrandSettings({
      name: input.brandForm.name.trim() || input.brandDefaults.name,
      assistantName: input.brandForm.assistantName.trim() || input.brandDefaults.assistantName,
      apiName: input.brandForm.apiName.trim() || input.brandDefaults.apiName,
      logoPath: input.brandForm.logoPath.trim() || input.brandDefaults.logoPath,
      faviconPath: input.brandForm.faviconPath.trim() || input.brandDefaults.faviconPath,
      typography: {
        fontStylesheetUrl: input.brandForm.fontStylesheetUrl.trim(),
        displayFontFamily:
          input.brandForm.displayFontFamily.trim() ||
          input.brandDefaults.typography.displayFontFamily,
        bodyFontFamily:
          input.brandForm.bodyFontFamily.trim() || input.brandDefaults.typography.bodyFontFamily,
        monoFontFamily:
          input.brandForm.monoFontFamily.trim() || input.brandDefaults.typography.monoFontFamily,
      },
      lightTheme:
        parseJson(input.brandForm.lightThemeJson, brandThemePaletteSchema) ??
        input.brandDefaults.lightTheme,
      darkTheme:
        parseJson(input.brandForm.darkThemeJson, brandThemePaletteSchema) ??
        input.brandDefaults.darkTheme,
      content: {
        tagline: input.brandForm.tagline.trim() || input.brandDefaults.content.tagline,
        defaultTitle:
          input.brandForm.defaultTitle.trim() || input.brandDefaults.content.defaultTitle,
        defaultDescription:
          input.brandForm.defaultDescription.trim() ||
          input.brandDefaults.content.defaultDescription,
        contentOverrides: parseBrandContentOverrides(input),
      },
    }),
  );
}

export function createSettingsPageDerivedState(input: DerivedStateInput) {
  const brandDraft = createBrandDraft(input);

  return {
    emailDeliveryConfigured: createEmailDeliveryConfigured(input),
    showOllamaHotTip: computed(() => input.aiRoutingDraft.chat.provider === "local"),
    localProviderDraftState: createLocalProviderDraftState(input),
    aiRoutingSections: createAiRoutingSections(input),
    routingModelOptions: createRoutingModelOptions(input),
    providerConfiguredById: createProviderConfiguredById(input),
    parseBrandContentOverrides: () => parseBrandContentOverrides(input),
    brandDraft,
    brandOverrideCount: computed(
      () => Object.keys(brandDraft.value.content.contentOverrides).length,
    ),
  };
}
