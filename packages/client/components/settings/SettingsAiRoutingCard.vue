<script setup lang="ts">
import type { AIProviderType, AIRoutingPurpose } from "@bao/shared/types/ai";

type AIRoutingDraft = Record<AIRoutingPurpose, { provider: AIProviderType; model: string }>;

defineProps<{
  providerInputs: ReadonlyArray<{
    id: AIProviderType;
    label: string;
    description: string;
    field: string;
  }>;
  aiRoutingSections: ReadonlyArray<{
    id: AIRoutingPurpose;
    label: string;
    description: string;
  }>;
  routingModelOptions: Readonly<Record<AIRoutingPurpose, ReadonlyArray<string>>>;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const aiRoutingDraft = defineModel<AIRoutingDraft>("aiRoutingDraft", { required: true });

const emit = defineEmits<{
  save: [];
}>();
</script>

<template>
  <div class="card mb-4 card-border bg-base-200">
    <div class="card-body gap-4 p-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <h3 class="font-semibold">{{ t("settings.aiProviders.routingTitle") }}</h3>
          <p class="text-sm text-base-content/60">{{ t("settings.aiProviders.routingSubtitle") }}</p>
        </div>
        <button class="btn btn-primary btn-sm" :aria-label="t('settings.aiProviders.saveRoutingAria')" @click="emit('save')">
          {{ t("settings.aiProviders.saveRoutingButton") }}
        </button>
      </div>

      <SectionGrid grid-token="twoColumnXl">
        <div
          v-for="section in aiRoutingSections"
          :key="section.id"
          class="space-y-3 rounded-box border border-base-300 bg-base-100 p-4"
        >
          <div class="space-y-1">
            <h4 class="font-medium">{{ section.label }}</h4>
            <p class="text-sm text-base-content/60">{{ section.description }}</p>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.aiProviders.purposeProviderLegend") }}</legend>
            <select
              v-model="aiRoutingDraft[section.id].provider"
              class="select w-full"
              :aria-label="t('settings.aiProviders.purposeProviderAria', { purpose: section.label })"
            >
              <option v-for="provider in providerInputs" :key="`${section.id}-${provider.id}`" :value="provider.id">
                {{ provider.label }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.aiProviders.purposeModelLegend") }}</legend>
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
            <p class="text-xs text-base-content/50">{{ t("settings.aiProviders.purposeModelHint") }}</p>
          </fieldset>
        </div>
      </SectionGrid>
    </div>
  </div>
</template>
