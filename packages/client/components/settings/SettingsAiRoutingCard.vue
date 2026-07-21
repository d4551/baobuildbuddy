<script setup lang="ts">
import type { AIProviderType, AIRoutingPurpose } from "@bao/shared/types/ai";
import type { ComposerTranslation } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  LEADING_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  MIN_WIDTH_FORM_COL_CLASS,
  MIN_WIDTH_SELECT_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

type AIRoutingDraft = Record<AIRoutingPurpose, { provider: AIProviderType; model: string }>;

const aiRoutingDraft = defineModel<AIRoutingDraft>("aiRoutingDraft", { required: true });

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
  t: ComposerTranslation;
}>();

const emit = defineEmits<{
  save: [];
}>();
</script>

<template>
  <UiGlassCard :extra-class="MARGIN_TOKEN_CLASS.mb4">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
          <h3 class="font-semibold">{{ t("settings.aiProviders.routingTitle") }}</h3>
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("settings.aiProviders.routingSubtitle") }}</p>
        </div>
        <button :class="[PRIMARY_ACTION_CLASS]" :aria-label="t('settings.aiProviders.saveRoutingAria')" @click="emit('save')">
          {{ t("settings.aiProviders.saveRoutingButton") }}
        </button>
      </div>

      <ResponsiveDataSurface>
        <template #cards>
          <ul
            class="list-none"
            :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]"
            :aria-label="t('settings.aiProviders.routingTitle')"
          >
            <li
              v-for="section in aiRoutingSections"
              :key="section.id"
              class="rounded-box border border-base-300 bg-base-100"
              :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3, PADDING_TOKEN_CLASS.p3]"
            >
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <p class="font-medium">{{ section.label }}</p>
                <p class="text-muted" :class="[LEADING_TOKEN_CLASS.leading5, TYPOGRAPHY_SCALE_CLASS.xs]">
                  {{ section.description }}
                </p>
              </div>
              <select
                class="select select-sm"
                v-model="aiRoutingDraft[section.id].provider"
                :class="[FLUID_WIDTH_CLASS]"
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
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
                <input
                  class="input input-sm"
                  v-model="aiRoutingDraft[section.id].model"
                  :list="`routing-model-options-${section.id}`"
                  type="text"
                  :class="[FLUID_WIDTH_CLASS]"
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
                <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  {{ t("settings.aiProviders.purposeModelHint") }}
                </p>
              </div>
            </li>
          </ul>
        </template>
        <template #table>
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
                  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                    <p class="font-medium">{{ section.label }}</p>
                    <p class="text-muted" :class="[LEADING_TOKEN_CLASS.leading5, TYPOGRAPHY_SCALE_CLASS.xs]">
                      {{ section.description }}
                    </p>
                  </div>
                </th>
                <td class="align-top">
                  <select
                    class="select select-sm"
                    v-model="aiRoutingDraft[section.id].provider"
                    :class="[FLUID_WIDTH_CLASS, MIN_WIDTH_FORM_COL_CLASS]"
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
                  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
                    <input
                      class="input input-sm"
                      v-model="aiRoutingDraft[section.id].model"
                      :list="`routing-model-options-${section.id}`"
                      type="text"
                      :class="[FLUID_WIDTH_CLASS, MIN_WIDTH_SELECT_CLASS]"
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
                    <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                      {{ t("settings.aiProviders.purposeModelHint") }}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </ResponsiveDataSurface>
    </div>
  </UiGlassCard>
</template>
