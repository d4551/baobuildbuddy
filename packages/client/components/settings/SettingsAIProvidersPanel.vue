<script setup lang="ts">
import type { AIProviderType, AIRoutingPurpose } from "@bao/shared";
import { LOCAL_AI_DEFAULT_ENDPOINT } from "@bao/shared";
import { useI18n } from "vue-i18n";

type ProviderField =
  | "localModelEndpoint"
  | "localModelName"
  | "geminiApiKey"
  | "openaiApiKey"
  | "claudeApiKey"
  | "huggingfaceToken";

type AIRoutingDraft = Record<AIRoutingPurpose, { provider: AIProviderType; model: string }>;

defineProps<{
  providerInputs: ReadonlyArray<{
    id: AIProviderType;
    label: string;
    description: string;
    field: ProviderField;
  }>;
  aiRoutingSections: ReadonlyArray<{
    id: AIRoutingPurpose;
    label: string;
    description: string;
  }>;
  routingModelOptions: Readonly<Record<AIRoutingPurpose, ReadonlyArray<string>>>;
  providerConfiguredById: Readonly<Record<AIProviderType, boolean>>;
  providerDiagnostics: Readonly<Partial<Record<AIProviderType, { message?: string } | undefined>>>;
  testResults: Readonly<Record<AIProviderType, { valid: boolean; message?: string } | null>>;
  testingProvider: AIProviderType | null;
  showOllamaHotTip: boolean;
}>();

const preferredProviderSelection = defineModel<AIProviderType>("preferredProviderSelection", {
  required: true,
});
const aiRoutingDraft = defineModel<AIRoutingDraft>("aiRoutingDraft", { required: true });
const apiKeys = defineModel<Record<ProviderField, string>>("apiKeys", { required: true });

const emit = defineEmits<{
  savePreferredProvider: [];
  saveRouting: [];
  testProvider: [providerId: AIProviderType];
  saveKeys: [];
}>();

const { t } = useI18n();

function providerKeyLabel(providerId: AIProviderType): string {
  if (providerId === "local") {
    return t("settings.aiProviders.endpointLabel");
  }
  return t("settings.aiProviders.credentialLabel");
}

function providerPlaceholder(providerId: AIProviderType, providerLabel: string): string {
  if (providerId === "local") {
    return LOCAL_AI_DEFAULT_ENDPOINT;
  }
  if (providerId === "huggingface") {
    return t("settings.aiProviders.huggingFacePlaceholder");
  }
  return t("settings.aiProviders.apiKeyPlaceholder", {
    provider: providerLabel,
  });
}
</script>

<template>
  <div class="card card-border bg-base-100">
    <div class="card-body">
      <h2 class="card-title">{{ t("settings.aiProviders.title") }}</h2>
      <p class="text-sm text-base-content/70 mb-3">
        {{ t("settings.aiProviders.subtitle") }}
      </p>

      <fieldset class="fieldset mb-4">
        <legend class="fieldset-legend">
          {{ t("settings.aiProviders.preferredProviderLegend") }}
        </legend>
        <select
          v-model="preferredProviderSelection"
          class="select w-full"
          :aria-label="t('settings.aiProviders.preferredProviderAria')"
        >
          <option
            v-for="provider in providerInputs"
            :key="provider.id"
            :value="provider.id"
          >
            {{ provider.label }}
          </option>
        </select>
        <p class="text-xs text-base-content/50 mt-1">
          {{ t("settings.aiProviders.preferredProviderHint") }}
        </p>
        <div class="mt-2 flex justify-end">
          <button
            class="btn btn-outline btn-sm"
            :aria-label="t('settings.aiProviders.preferredProviderAria')"
            @click="emit('savePreferredProvider')"
          >
            {{ t("settings.aiProviders.preferredProviderSaveButton") }}
          </button>
        </div>
      </fieldset>

      <SettingsAiRoutingCard
        v-model:ai-routing-draft="aiRoutingDraft"
        :provider-inputs="providerInputs"
        :ai-routing-sections="aiRoutingSections"
        :routing-model-options="routingModelOptions"
        :t="t"
        @save="emit('saveRouting')"
      />

      <SettingsAiProviderAccordionList
        v-model:api-keys="apiKeys"
        :provider-inputs="providerInputs"
        :provider-configured-by-id="providerConfiguredById"
        :provider-diagnostics="providerDiagnostics"
        :test-results="testResults"
        :testing-provider="testingProvider"
        :show-ollama-hot-tip="showOllamaHotTip"
        :t="t"
        :provider-key-label="providerKeyLabel"
        :provider-placeholder="providerPlaceholder"
        @test-provider="emit('testProvider', $event)"
        @save-keys="emit('saveKeys')"
      />
    </div>
  </div>
</template>
