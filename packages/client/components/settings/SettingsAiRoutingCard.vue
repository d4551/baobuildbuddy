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

      <div class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table class="table table-sm" :aria-label="t('settings.aiProviders.routingTitle')">
          <thead>
            <tr>
              <th scope="col">{{ t("settings.aiProviders.purposeColumnLabel") }}</th>
              <th scope="col">{{ t("settings.aiProviders.purposeProviderLegend") }}</th>
              <th scope="col">{{ t("settings.aiProviders.purposeModelLegend") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="section in aiRoutingSections" :key="section.id">
              <th scope="row" class="align-top">
                <div class="space-y-1">
                  <p class="font-medium">{{ section.label }}</p>
                  <p class="text-xs leading-5 text-base-content/60">{{ section.description }}</p>
                </div>
              </th>
              <td class="align-top">
                <select
                  v-model="aiRoutingDraft[section.id].provider"
                  class="select select-sm w-full min-w-40"
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
              </td>
              <td class="align-top">
                <div class="space-y-2">
                  <input
                    v-model="aiRoutingDraft[section.id].model"
                    :list="`routing-model-options-${section.id}`"
                    type="text"
                    class="input input-sm w-full min-w-52"
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
