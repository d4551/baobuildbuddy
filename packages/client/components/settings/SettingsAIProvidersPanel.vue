<script setup lang="ts">
import type { AIProviderType, AIRoutingPurpose } from "@bao/shared";
import { LOCAL_AI_DEFAULT_ENDPOINT, OLLAMA_WEBSITE_URL } from "@bao/shared";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

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

      <div class="card card-border bg-base-200 mb-4">
        <div class="card-body gap-4 p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1">
              <h3 class="font-semibold">{{ t("settings.aiProviders.routingTitle") }}</h3>
              <p class="text-sm text-base-content/60">
                {{ t("settings.aiProviders.routingSubtitle") }}
              </p>
            </div>
            <button
              class="btn btn-primary btn-sm"
              :aria-label="t('settings.aiProviders.saveRoutingAria')"
              @click="emit('saveRouting')"
            >
              {{ t("settings.aiProviders.saveRoutingButton") }}
            </button>
          </div>

          <SectionGrid grid-token="twoColumnXl">
            <div
              v-for="section in aiRoutingSections"
              :key="section.id"
              class="rounded-box border border-base-300 bg-base-100 p-4 space-y-3"
            >
              <div class="space-y-1">
                <h4 class="font-medium">{{ section.label }}</h4>
                <p class="text-sm text-base-content/60">{{ section.description }}</p>
              </div>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.aiProviders.purposeProviderLegend") }}
                </legend>
                <select
                  v-model="aiRoutingDraft[section.id].provider"
                  class="select w-full"
                  :aria-label="t('settings.aiProviders.purposeProviderAria', { purpose: section.label })"
                >
                  <option
                    v-for="provider in providerInputs"
                    :key="`${section.id}-${provider.id}`"
                    :value="provider.id"
                  >
                    {{ provider.label }}
                  </option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.aiProviders.purposeModelLegend") }}
                </legend>
                <input
                  v-model="aiRoutingDraft[section.id].model"
                  :list="`routing-model-options-${section.id}`"
                  type="text"
                  class="input w-full"
                  :placeholder="t('settings.aiProviders.purposeModelPlaceholder')"
                  :aria-label="t('settings.aiProviders.purposeModelAria', { purpose: section.label })"
                />
                <datalist :id="`routing-model-options-${section.id}`">
                  <option
                    v-for="model in routingModelOptions[section.id]"
                    :key="`${section.id}-${aiRoutingDraft[section.id].provider}-${model}`"
                    :value="model"
                  >
                    {{ model }}
                  </option>
                </datalist>
                <p class="text-xs text-base-content/50">
                  {{ t("settings.aiProviders.purposeModelHint") }}
                </p>
              </fieldset>
            </div>
          </SectionGrid>
        </div>
      </div>

      <div
        v-if="showOllamaHotTip"
        role="alert"
        class="alert alert-info alert-soft alert-vertical mb-4 sm:alert-horizontal"
      >
        <IconInfoCircle class="h-6 w-6 shrink-0 stroke-current" />
        <div>
          <h3 class="font-semibold">
            {{ t("settings.aiProviders.ollamaTipTitle") }}
          </h3>
          <p class="text-sm">
            {{ t("settings.aiProviders.ollamaTipDescription") }}
            <NuxtLink
              :to="OLLAMA_WEBSITE_URL"
              target="_blank"
              class="link link-primary"
              :aria-label="t('settings.aiProviders.ollamaTipLinkAria')"
            >
              {{ t("settings.aiProviders.ollamaTipLinkLabel") }}
            </NuxtLink>
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="provider in providerInputs"
          :key="provider.id"
          class="collapse collapse-arrow border border-base-300 bg-base-100"
        >
          <input
            type="radio"
            name="provider-accordion"
            :aria-label="t('settings.aiProviders.expandAria', { provider: provider.label })"
          />
          <div class="collapse-title font-medium flex items-center gap-2">
            <AIProviderIcon
              :provider-id="provider.id"
              class="h-5 w-5 text-primary"
            />
            {{ provider.label }}
            <span
              v-if="providerConfiguredById[provider.id]"
              class="badge badge-success badge-xs"
            >
              {{ t("settings.aiProviders.configuredBadge") }}
            </span>
          </div>
          <div class="collapse-content space-y-3">
            <p class="text-sm text-base-content/60">
              {{ provider.description }}
            </p>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ providerKeyLabel(provider.id) }}
              </legend>
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
                  <span
                    v-if="testingProvider === provider.id"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  {{ t("settings.aiProviders.testButton") }}
                </button>
              </div>
            </fieldset>

            <fieldset v-if="provider.id === 'local'" class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.aiProviders.localModelLegend") }}
              </legend>
              <input
                v-model="apiKeys.localModelName"
                type="text"
                class="input w-full"
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
              class="text-sm text-base-content/60"
            >
              {{ providerDiagnostics[provider.id]?.message }}
            </p>
            <p
              v-else-if="testResults[provider.id]?.message"
              class="text-sm text-base-content/60"
            >
              {{ testResults[provider.id]?.message }}
            </p>
          </div>
        </div>
      </div>

      <div class="card-actions justify-end mt-4">
        <button
          class="btn btn-primary"
          :aria-label="t('settings.aiProviders.saveAria')"
          @click="emit('saveKeys')"
        >
          {{ t("settings.aiProviders.saveButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
