<script setup lang="ts">
import type { AIProviderType } from "@bao/shared/types/ai";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  STATS_SHELL_VARIANT_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const preferredProviderSelection = defineModel<AIProviderType>("preferredProviderSelection", {
  required: true,
});

const props = defineProps<{
  providerInputs: ReadonlyArray<{ id: AIProviderType; label: string }>;
  selectedProviderLabel: string;
  saveState?: "idle" | "saving" | "success" | "error";
}>();

const emit = defineEmits<{
  save: [];
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard :aria-label="t('settings.aiProviders.preferredProviderLegend')">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h3 class="card-title text-base">{{ t("settings.aiProviders.preferredProviderLegend") }}</h3>
        <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("settings.aiProviders.preferredProviderHint") }}
        </p>
      </div>

      <div :class="[STATS_SHELL_VARIANT_CLASS.vertical, SHADOW_TOKEN_CLASS.sm]">
        <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
          <div class="stat-title">{{ t("settings.aiProviders.preferredProviderLegend") }}</div>
          <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">
            {{ props.selectedProviderLabel }}
          </div>
          <div class="stat-desc">{{ t("settings.aiProviders.preferredProviderSaveButton") }}</div>
        </div>
      </div>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t("settings.aiProviders.preferredProviderLegend") }}
        </legend>
        <select
          v-model="preferredProviderSelection"
          class="select"
          :class="[FLUID_WIDTH_CLASS]"
          :aria-label="t('settings.aiProviders.preferredProviderAria')"
        >
          <option v-for="provider in props.providerInputs" :key="provider.id" :value="provider.id">
            {{ provider.label }}
          </option>
        </select>
      </fieldset>

      <div class="flex justify-end">
        <button
          type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('settings.aiProviders.preferredProviderAria')"
          :disabled="props.saveState === 'saving'"
          :aria-busy="props.saveState === 'saving'"
          @click="emit('save')"
        >
          {{ t("settings.aiProviders.preferredProviderSaveButton") }}
        </button>
      </div>
    </div>
  </UiGlassCard>
</template>
