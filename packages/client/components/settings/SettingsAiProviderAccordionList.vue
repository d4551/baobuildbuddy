<script setup lang="ts">
import { OLLAMA_WEBSITE_URL } from "@bao/shared/constants/ai-provider";
import type { AIProviderType } from "@bao/shared/types/ai";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

type ProviderField =
  | "localModelEndpoint"
  | "localModelName"
  | "geminiApiKey"
  | "openaiApiKey"
  | "claudeApiKey"
  | "huggingfaceToken";

const apiKeys = defineModel<Record<ProviderField, string>>("apiKeys", { required: true });

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

const emit = defineEmits<{
  testProvider: [providerId: AIProviderType];

  saveKeys: [];
}>();
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
    <div 
      v-if="showOllamaHotTip"
      role="alert"
      class="alert alert-info alert-soft alert-vertical sm:alert-horizontal" :class="[MARGIN_TOKEN_CLASS.mb4]"
    >
      <IconInfoCircle class="shrink-0 stroke-current" :class="[ICON_SIZE_CLASS[6]]"/>
      <div>
        <h3 class="font-semibold">{{ t("settings.aiProviders.ollamaTipTitle") }}</h3>
        <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("settings.aiProviders.ollamaTipDescription") }}
          <NuxtLink :to="OLLAMA_WEBSITE_URL" target="_blank" class="link link-primary" :aria-label="t('settings.aiProviders.ollamaTipLinkAria')">
            {{ t("settings.aiProviders.ollamaTipLinkLabel") }}
          </NuxtLink>
        </p>
      </div>
    </div>

    <details 
      v-for="provider in providerInputs"
      :key="provider.id"
      class="collapse collapse-arrow border border-base-300 bg-base-100"
    >
      <summary class="collapse-title flex items-center font-medium" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
        <AIProviderIcon class="text-primary" :class="[ICON_SIZE_CLASS[5]]" :provider-id="provider.id"/>
        {{ provider.label }}
        <span v-if="providerConfiguredById[provider.id]" class="badge badge-success badge-xs">
          {{ t("settings.aiProviders.configuredBadge") }}
        </span>
      </summary>
      <div class="collapse-content" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ provider.description }}</p>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ providerKeyLabel(provider.id) }}</legend>
          <div class="join" :class="[FLUID_WIDTH_CLASS]">
            <input 
              v-model="apiKeys[provider.field]"
              :type="provider.id === 'local' ? 'text' : 'password'"
              :placeholder="providerPlaceholder(provider.id, provider.label)"
              class="input join-item" :class="[FLUID_WIDTH_CLASS]"
              :aria-label="providerKeyLabel(provider.id)"
            />
            <button 
              type="button"
              class="btn btn-outline join-item"
              :aria-label="t('settings.aiProviders.testAria')"
              @click="emit('testProvider', provider.id)"
            >
              <LoadingSpinner
                v-if="testingProvider === provider.id"
                size="xs"
                :label="t('settings.aiProviders.testButton')"
              />
              {{ t("settings.aiProviders.testButton") }}
            </button>
          </div>
        </fieldset>

        <fieldset v-if="provider.id === 'local'" class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.aiProviders.localModelLegend") }}</legend>
          <input 
            v-model="apiKeys.localModelName"
            type="text"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('settings.aiProviders.localModelPlaceholder')"
            :aria-label="t('settings.aiProviders.localModelAria')"
          />
        </fieldset>

        <span 
          v-if="testResults[provider.id]"
          class="badge"
          :class="testResults[provider.id]?.valid ? 'badge-success' : 'badge-error'"
        >
          {{
            testResults[provider.id]?.valid
              ? t("settings.aiProviders.connectedBadge")
              : t("settings.aiProviders.failedBadge")
          }}
        </span>
        <p 
          v-if="!testResults[provider.id] && providerDiagnostics[provider.id]?.message"
          class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
        >
          {{ providerDiagnostics[provider.id]?.message }}
        </p>
        <p v-else-if="testResults[provider.id]?.message" class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ testResults[provider.id]?.message }}
        </p>
      </div>
    </details>

    <div class="flex justify-end" :class="[MARGIN_TOKEN_CLASS.mt4]">
      <button :class="[PRIMARY_ACTION_CLASS]" :aria-label="t('settings.aiProviders.saveAria')" @click="emit('saveKeys')">
        {{ t("settings.aiProviders.saveButton") }}
      </button>
    </div>
  </div>
</template>
