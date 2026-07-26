<script setup lang="ts">
import type { AIProviderType } from "@bao/shared/types/ai";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import UiGlassCard from "~/components/ui/UiGlassCard.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { getSaveStateBadgeClass, getSaveStateLabelKey, type SaveState } from "./save-state";

const preferredProviderSelection = defineModel<AIProviderType>("preferredProviderSelection", {
  required: true,
});

const props = withDefaults(
  defineProps<{
    providerInputs: ReadonlyArray<{
      id: AIProviderType;
      label: string;
      description: string;
      field: string;
    }>;
    selectedProviderLabel: string;
    saveState?: SaveState;
  }>(),
  { saveState: "idle" },
);

const emit = defineEmits<{
  save: [];
}>();

const { t } = useI18n();

const saveStateLabel = computed(() => {
  const key = getSaveStateLabelKey(props.saveState);
  return key ? t(key) : "";
});

const isSaving = computed(() => props.saveState === "saving");
</script>

<template>
  <UiGlassCard :aria-label="t('settings.aiProviders.preferredProviderLegend')">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
      <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between"
        :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
      >
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
          <h3 class="card-title text-base">
            {{ t("settings.aiProviders.preferredProviderLegend") }}
          </h3>
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.aiProviders.preferredProviderHint") }}
          </p>
        </div>
        <span
          v-if="saveStateLabel"
          class="badge"
          :class="getSaveStateBadgeClass(saveState)"
          role="status"
          aria-live="polite"
        >
          {{ saveStateLabel }}
        </span>
      </div>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t("settings.aiProviders.preferredProviderLegend") }}
        </legend>
        <select
          v-model="preferredProviderSelection"
          class="select select-sm"
          :class="[FLUID_WIDTH_CLASS]"
          :aria-label="t('settings.aiProviders.preferredProviderAria')"
        >
          <option v-for="provider in props.providerInputs" :key="provider.id" :value="provider.id">
            {{ provider.label }}
          </option>
        </select>
      </fieldset>

      <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ props.selectedProviderLabel }}
      </p>

      <button
        type="button"
        :class="[PRIMARY_ACTION_CLASS]"
        :disabled="isSaving"
        :aria-label="t('settings.aiProviders.preferredProviderAria')"
        @click="emit('save')"
      >
        {{ t("settings.aiProviders.preferredProviderSaveButton") }}
      </button>

      <p v-if="saveState === 'success'" class="text-success" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("settings.aiProviders.preferredProviderSaved") }}
      </p>
    </div>
  </UiGlassCard>
</template>
