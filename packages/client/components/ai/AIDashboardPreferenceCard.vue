<script setup lang="ts">
import type { AIProviderType } from "@bao/shared/types/ai";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PRIMARY_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { ProviderConfig } from "~/types/ai-dashboard";

const selectedModelValue = defineModel<string>("selectedModel", { required: true });
const selectedProviderModel = defineModel<AIProviderType>("selectedProvider", { required: true });

const props = defineProps<{
  loading: boolean;
  providers: readonly ProviderConfig[];
  selectedProviderModels: readonly string[];
  isProviderConfigured: (providerId: AIProviderType) => boolean;
  providerSelectOptionLabel: (provider: ProviderConfig) => string;
  onSave: () => Promise<void> | void;
  t: (key: string, params?: Record<string, string | number>) => string;
}>();
</script>

<template>
  <UiGlassCard>
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <h2 class="card-title">{{ props.t("aiDashboard.preference.title") }}</h2>
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ props.t("aiDashboard.preference.description") }}
      </p>

      <SectionGrid grid-token="twoColumn">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ props.t("aiDashboard.preference.providerLegend") }}</legend>
          <select
            v-model="selectedProviderModel"
            class="select"
            :class="[FLUID_WIDTH_CLASS]"
            :aria-label="props.t('aiDashboard.preference.providerAria')"
          >
            <option disabled value="">{{ props.t("aiDashboard.preference.selectProviderOption") }}</option>
            <option
              v-for="provider in props.providers"
              :key="provider.id"
              :value="provider.id"
              :disabled="!props.isProviderConfigured(provider.id)"
            >
              {{ props.providerSelectOptionLabel(provider) }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ props.t("aiDashboard.preference.modelLegend") }}</legend>
          <select
            v-model="selectedModelValue"
            class="select"
            :class="[FLUID_WIDTH_CLASS]"
            :aria-label="props.t('aiDashboard.preference.modelAria')"
            :disabled="props.selectedProviderModels.length === 0"
          >
            <option disabled value="">{{ props.t("aiDashboard.preference.selectModelOption") }}</option>
            <option v-for="model in props.selectedProviderModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </fieldset>
      </SectionGrid>

      <div class="card-actions justify-end">
        <button
          type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :disabled="!selectedProviderModel || !selectedModelValue || props.loading"
          :aria-label="props.t('aiDashboard.preference.saveAria')"
          @click="props.onSave"
        >
          <LoadingSpinner v-if="props.loading" size="xs" :label="props.t('common.loading')" />
          <span>{{ props.t("aiDashboard.preference.saveButton") }}</span>
        </button>
      </div>
    </div>
  </UiGlassCard>
</template>
