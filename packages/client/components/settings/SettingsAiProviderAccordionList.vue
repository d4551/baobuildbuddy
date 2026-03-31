<script setup lang="ts">
import { LOCAL_AI_DEFAULT_ENDPOINT, OLLAMA_WEBSITE_URL } from "@bao/shared/constants/ai-provider";
import type { AIProviderType } from "@bao/shared/types/ai";

type ProviderField =
  | "localModelEndpoint"
  | "localModelName"
  | "geminiApiKey"
  | "openaiApiKey"
  | "claudeApiKey"
  | "huggingfaceToken";

defineProps<{
  providerInputs: ReadonlyArray<{
    id: AIProviderType;
    label: string;
    description: string;
    field: ProviderField;
  }>;
  providerConfiguredById: Readonly<Record<AIProviderType, boolean>>;
  providerDiagnostics: Readonly<Partial<Record<AIProviderType, { message?: string } | undefined>>>;
  testResults: Readonly<Record<AIProviderType, { valid: boolean; message?: string } | null>>;
  testingProvider: AIProviderType | null;
  showOllamaHotTip: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
  providerKeyLabel: (providerId: AIProviderType) => string;
  providerPlaceholder: (providerId: AIProviderType, providerLabel: string) => string;
}>();

const apiKeys = defineModel<Record<ProviderField, string>>("apiKeys", { required: true });

const emit = defineEmits<{
  testProvider: [providerId: AIProviderType];
  saveKeys: [];
}>();
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="showOllamaHotTip"
      role="alert"
      class="alert alert-info alert-soft alert-vertical mb-4 sm:alert-horizontal"
    >
      <IconInfoCircle class="h-6 w-6 shrink-0 stroke-current" />
      <div>
        <h3 class="font-semibold">{{ t("settings.aiProviders.ollamaTipTitle") }}</h3>
        <p class="text-sm">
          {{ t("settings.aiProviders.ollamaTipDescription") }}
          <NuxtLink :to="OLLAMA_WEBSITE_URL" target="_blank" class="link link-primary" :aria-label="t('settings.aiProviders.ollamaTipLinkAria')">
            {{ t("settings.aiProviders.ollamaTipLinkLabel") }}
          </NuxtLink>
        </p>
      </div>
    </div>

    <div v-for="provider in providerInputs" :key="provider.id" class="collapse collapse-arrow border border-base-300 bg-base-100">
      <input
        type="radio"
        name="provider-accordion"
        :aria-label="t('settings.aiProviders.expandAria', { provider: provider.label })"
      />
      <div class="collapse-title flex items-center gap-2 font-medium">
        <AIProviderIcon :provider-id="provider.id" class="h-5 w-5 text-primary" />
        {{ provider.label }}
        <span v-if="providerConfiguredById[provider.id]" class="badge badge-success badge-xs">
          {{ t("settings.aiProviders.configuredBadge") }}
        </span>
      </div>
      <div class="collapse-content space-y-3">
        <p class="text-sm text-base-content/60">{{ provider.description }}</p>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ providerKeyLabel(provider.id) }}</legend>
          <div class="join w-full">
            <input
              v-model="apiKeys[provider.field]"
              :type="provider.id === 'local' ? 'text' : 'password'"
              :placeholder="providerPlaceholder(provider.id, provider.label)"
              class="input join-item w-full"
              :aria-label="providerKeyLabel(provider.id)"
            />
            <button
              type="button"
              class="btn btn-outline join-item"
              :aria-label="t('settings.aiProviders.testAria')"
              @click="emit('testProvider', provider.id)"
            >
              <span v-if="testingProvider === provider.id" class="loading loading-spinner loading-xs"></span>
              {{ t("settings.aiProviders.testButton") }}
            </button>
          </div>
        </fieldset>

        <fieldset v-if="provider.id === 'local'" class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.aiProviders.localModelLegend") }}</legend>
          <input
            v-model="apiKeys.localModelName"
            type="text"
            class="input w-full"
            :placeholder="LOCAL_AI_DEFAULT_ENDPOINT"
            :aria-label="t('settings.aiProviders.localModelAria')"
          />
        </fieldset>

        <span
          v-if="testResults[provider.id]"
          class="badge"
          :class="testResults[provider.id]?.valid ? 'badge-success' : 'badge-error'"
        >
          {{ testResults[provider.id]?.valid ? t("settings.aiProviders.connectedBadge") : t("settings.aiProviders.failedBadge") }}
        </span>
        <p v-if="!testResults[provider.id] && providerDiagnostics[provider.id]?.message" class="text-sm text-base-content/60">
          {{ providerDiagnostics[provider.id]?.message }}
        </p>
        <p v-else-if="testResults[provider.id]?.message" class="text-sm text-base-content/60">
          {{ testResults[provider.id]?.message }}
        </p>
      </div>
    </div>

    <div class="mt-4 flex justify-end">
      <button class="btn btn-primary" :aria-label="t('settings.aiProviders.saveAria')" @click="emit('saveKeys')">
        {{ t("settings.aiProviders.saveButton") }}
      </button>
    </div>
  </div>
</template>
