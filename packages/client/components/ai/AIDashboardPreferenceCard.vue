<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, FLUID_WIDTH_CLASS, SURFACE_GLASS_CARD_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import type { AIProviderType } from "@bao/shared/types/ai";
import type { ProviderConfig } from "~/types/ai-dashboard";
import SectionGrid from "~/components/ui/SectionGrid.vue";

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
  <div :class="[SURFACE_GLASS_CARD_CLASS, 'glass-card-hover']">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <h2 class="card-title">{{ t("aiDashboard.preference.title") }}</h2>
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("aiDashboard.preference.description") }}</p>

      <SectionGrid grid-token="twoColumn">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("aiDashboard.preference.providerLegend") }}</legend>
          <select
            v-model="selectedProviderModel"
            class="select" :class="[FLUID_WIDTH_CLASS]"
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
            class="select" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('aiDashboard.preference.modelAria')"
            :disabled="selectedProviderModels.length === 0"
          >
            <option disabled value="">{{ t("aiDashboard.preference.selectModelOption") }}</option>
            <option v-for="model in selectedProviderModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </fieldset>
      </SectionGrid>

      <div class="card-actions justify-end">
        <button
          class="btn btn-primary"
          :disabled="!selectedProviderModel || !selectedModelValue || loading"
          :aria-label="t('aiDashboard.preference.saveAria')"
          @click="onSave"
        >
          <LoadingSpinner size="xs" label="Loading" v-if="loading" />
          <span>{{ t("aiDashboard.preference.saveButton") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
