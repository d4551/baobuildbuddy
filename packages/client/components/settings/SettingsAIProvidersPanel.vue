<script setup lang="ts">
import { LOCAL_AI_DEFAULT_ENDPOINT } from "@bao/shared/constants/ai-provider";
import { OPENAI_V1_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import type { AIProviderType, AIRoutingPurpose } from "@bao/shared/types/ai";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";

type ProviderField =
  | "localModelEndpoint"
  | "localModelName"
  | "geminiApiKey"
  | "openaiApiKey"
  | "claudeApiKey"
  | "huggingfaceToken";

type AIRoutingDraft = Record<AIRoutingPurpose, { provider: AIProviderType; model: string }>;

const props = defineProps<{
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
const runtimeConfig = useRuntimeConfig();

const openaiV1BaseUrl = computed(() => {
  const rawBase = String(runtimeConfig.public.apiBase ?? "http://localhost:3000");
  const apiBase = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  return `${apiBase}${OPENAI_V1_ENDPOINT_PREFIX}`;
});

const configuredProviderCount = computed(
  () => props.providerInputs.filter((provider) => props.providerConfiguredById[provider.id]).length,
);
const routingSectionCount = computed(() => props.aiRoutingSections.length);

const selectedProviderLabel = computed(
  () =>
    props.providerInputs.find((provider) => provider.id === preferredProviderSelection.value)
      ?.label ?? preferredProviderSelection.value,
);

function providerStatusClass(providerId: AIProviderType): string {
  const testResult = props.testResults[providerId];
  if (testResult) {
    return testResult.valid ? "badge-success" : "badge-error";
  }
  return props.providerConfiguredById[providerId] ? "badge-success" : "badge-ghost";
}

function providerStatusLabel(providerId: AIProviderType): string {
  const testResult = props.testResults[providerId];
  if (testResult) {
    return testResult.valid
      ? t("settings.aiProviders.connectedBadge")
      : t("settings.aiProviders.failedBadge");
  }
  return props.providerConfiguredById[providerId]
    ? t("settings.aiProviders.configuredBadge")
    : t("settings.aiProviders.testButton");
}

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
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body gap-6">
      <SettingsPanelHeader
        :title="t('settings.aiProviders.title')"
        :description="t('settings.aiProviders.subtitle')"
      >
        <template #meta>
          <span class="badge badge-neutral badge-sm" aria-hidden="true">
            {{ configuredProviderCount }}/{{ props.providerInputs.length }}
          </span>
        </template>
      </SettingsPanelHeader>

      <div
        role="note"
        class="alert alert-info alert-soft"
        :aria-label="t('settings.aiProviders.openaiV1Aria')"
      >
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1, TRUNCATE_FLEX_CHILD_CLASS]">
          <p class="font-semibold">{{ t("settings.aiProviders.openaiV1Title") }}</p>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("settings.aiProviders.openaiV1Description") }}</p>
          <code class="glass-subtle block break-all rounded-box px-3 py-2" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ openaiV1BaseUrl }}
          </code>
        </div>
      </div>

      <div class="stats stats-vertical bg-base-200 lg:stats-horizontal" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm]">
        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.aiProviders.readinessTitle") }}</div>
          <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ configuredProviderCount }}</div>
          <div class="stat-desc">{{ t("settings.aiProviders.readinessDescription") }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.aiProviders.preferredProviderLegend") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ selectedProviderLabel }}</div>
          <div class="stat-desc">{{ t("settings.aiProviders.preferredProviderHint") }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.aiProviders.routingCoverageTitle") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ routingSectionCount }}</div>
          <div class="stat-desc">{{ t("settings.aiProviders.routingCoverageDescription") }}</div>
        </div>
      </div>

      <SectionGrid grid-token="providersSplit">
        <section :class="SURFACE_GLASS_CARD_CLASS" :aria-label="t('settings.aiProviders.title')">
          <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
            <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <h3 class="card-title text-base">{{ t("settings.aiProviders.readinessTitle") }}</h3>
                <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ t("settings.aiProviders.readinessDescription") }}
                </p>
              </div>
              <span class="badge badge-ghost badge-sm" aria-hidden="true">
                {{ configuredProviderCount }}
              </span>
            </div>

            <SectionGrid grid-token="twoColumnMdGap3">
              <article
                v-for="provider in props.providerInputs"
                :key="provider.id"
                class="rounded-box border border-base-300 bg-base-100" :class="[PADDING_TOKEN_CLASS.p4]"
              >
                <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
                  <div class="flex items-start" :class="[TRUNCATE_FLEX_CHILD_CLASS, FLEX_GAP_TOKEN_CLASS.gap3]">
                    <AIProviderIcon :provider-id="provider.id" class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
                      <p class="font-medium">{{ provider.label }}</p>
                      <p class="text-muted" :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.sm]">
                        {{ provider.description }}
                      </p>
                    </div>
                  </div>
                  <span class="badge badge-sm shrink-0" :class="providerStatusClass(provider.id)">
                    {{ providerStatusLabel(provider.id) }}
                  </span>
                </div>

                <p
                  v-if="props.testResults[provider.id]?.message || props.providerDiagnostics[provider.id]?.message"
                  class="mt-3 text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]"
                >
                  {{
                    props.testResults[provider.id]?.message ||
                      props.providerDiagnostics[provider.id]?.message
                  }}
                </p>
              </article>
            </SectionGrid>
          </div>
        </section>

        <section
          :class="SURFACE_GLASS_CARD_CLASS"
          :aria-label="t('settings.aiProviders.preferredProviderLegend')"
        >
          <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
            <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
              <h3 class="card-title text-base">{{ t("settings.aiProviders.preferredProviderLegend") }}</h3>
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("settings.aiProviders.preferredProviderHint") }}</p>
            </div>

            <div class="stats stats-vertical bg-base-100" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm]">
              <div class="stat px-4 py-3">
                <div class="stat-title">{{ t("settings.aiProviders.preferredProviderLegend") }}</div>
                <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ selectedProviderLabel }}</div>
                <div class="stat-desc">{{ t("settings.aiProviders.preferredProviderSaveButton") }}</div>
              </div>
            </div>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.aiProviders.preferredProviderLegend") }}
              </legend>
              <select
                v-model="preferredProviderSelection"
                class="select" :class="[FLUID_WIDTH_CLASS]"
                :aria-label="t('settings.aiProviders.preferredProviderAria')"
              >
                <option
                  v-for="provider in props.providerInputs"
                  :key="provider.id"
                  :value="provider.id"
                >
                  {{ provider.label }}
                </option>
              </select>
            </fieldset>

            <div class="flex justify-end">
              <button
                class="btn btn-primary btn-sm"
                :aria-label="t('settings.aiProviders.preferredProviderAria')"
                @click="emit('savePreferredProvider')"
              >
                {{ t("settings.aiProviders.preferredProviderSaveButton") }}
              </button>
            </div>
          </div>
        </section>
      </SectionGrid>

      <SettingsAiRoutingCard
        v-model:ai-routing-draft="aiRoutingDraft"
        :provider-inputs="props.providerInputs"
        :ai-routing-sections="props.aiRoutingSections"
        :routing-model-options="props.routingModelOptions"
        :t="t"
        @save="emit('saveRouting')"
      />

      <section :class="SURFACE_GLASS_CARD_CLASS" :aria-label="t('settings.aiProviders.saveAria')">
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
            <h3 class="card-title text-base">{{ t("settings.aiProviders.saveButton") }}</h3>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("settings.aiProviders.credentialsDescription") }}
            </p>
          </div>

          <SettingsAiProviderAccordionList
            v-model:api-keys="apiKeys"
            :provider-inputs="props.providerInputs"
            :provider-configured-by-id="props.providerConfiguredById"
            :provider-diagnostics="props.providerDiagnostics"
            :test-results="props.testResults"
            :testing-provider="props.testingProvider"
            :show-ollama-hot-tip="props.showOllamaHotTip"
            :t="t"
            :provider-key-label="providerKeyLabel"
            :provider-placeholder="providerPlaceholder"
            @test-provider="emit('testProvider', $event)"
            @save-keys="emit('saveKeys')"
          />
        </div>
      </section>
    </div>
  </div>
</template>
