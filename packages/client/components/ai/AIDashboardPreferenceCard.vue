<script setup lang="ts">
import type { AIProviderType } from "@bao/shared";
import type { ProviderConfig } from "~/types/ai-dashboard";

defineProps<{
  loading: boolean;
  providers: readonly ProviderConfig[];
  selectedProviderModels: readonly string[];
  isProviderConfigured: (providerId: AIProviderType) => boolean;
  providerSelectOptionLabel: (provider: ProviderConfig) => string;
  onSave: () => Promise<void> | void;
  t: (key: string, params?: Record<string, string | number>) => string;
}>();

const selectedProviderModel = defineModel<AIProviderType>("selectedProvider", { required: true });
const selectedModelValue = defineModel<string>("selectedModel", { required: true });
</script>

<template>
  <div class="card card-border bg-base-100 shadow-sm">
    <div class="card-body gap-4">
      <h2 class="card-title">{{ t("aiDashboard.preference.title") }}</h2>
      <p class="text-sm text-base-content/70">{{ t("aiDashboard.preference.description") }}</p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("aiDashboard.preference.providerLegend") }}</legend>
          <select
            v-model="selectedProviderModel"
            class="select w-full"
            :aria-label="t('aiDashboard.preference.providerAria')"
          >
            <option disabled value="">{{ t("aiDashboard.preference.selectProviderOption") }}</option>
            <option
              v-for="provider in providers"
              :key="provider.id"
              :value="provider.id"
              :disabled="!isProviderConfigured(provider.id)"
            >
              {{ providerSelectOptionLabel(provider) }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("aiDashboard.preference.modelLegend") }}</legend>
          <select
            v-model="selectedModelValue"
            class="select w-full"
            :aria-label="t('aiDashboard.preference.modelAria')"
            :disabled="selectedProviderModels.length === 0"
          >
            <option disabled value="">{{ t("aiDashboard.preference.selectModelOption") }}</option>
            <option v-for="model in selectedProviderModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </fieldset>
      </div>

      <div class="card-actions justify-end">
        <button
          class="btn btn-primary"
          :disabled="!selectedProvider || !selectedModel || loading"
          :aria-label="t('aiDashboard.preference.saveAria')"
          @click="onSave"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          <span>{{ t("aiDashboard.preference.saveButton") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
