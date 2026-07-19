<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  brandName: string;
  assistantName: string;
  authBootstrapRequired: boolean;
  authSetupTokenConfigured: boolean;
  needsStoredApiKey: boolean;
  authSetupToken: string;
  existingApiKey: string;
  saving: boolean;
}>();

const emit = defineEmits<{
  "update:auth-setup-token": [value: string];
  "update:existing-api-key": [value: string];
  back: [];
  complete: [];
}>();

const { t } = useI18n();

function updateTextValue(
  event: Event,
  emitEvent: "update:auth-setup-token" | "update:existing-api-key",
): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit(emitEvent, target.value);
  }
}
</script>

<template>
  <div class="text-center" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
    <div class="flex justify-center" :class="[MARGIN_TOKEN_CLASS.mb4]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="text-success" :class="[ICON_SIZE_CLASS['14']]"
        fill="none"
        stroke="currentColor"
        :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </svg>
      <span class="sr-only">{{ t("setup.successStatusAria") }}</span>
    </div>
    <h2 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("setup.doneTitle") }}</h2>
    <p class="text-secondary">
      {{ t("setup.doneDescription", { assistant: assistantName }) }}
    </p>

    <div
      v-if="authBootstrapRequired && authSetupTokenConfigured"
      role="alert"
      class="alert alert-info alert-vertical text-left sm:alert-horizontal"
    >
      <div>
        <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold]">{{ t("setup.auth.setupTokenTitle") }}</h3>
        <div :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("setup.auth.setupTokenDescription") }}</div>
      </div>
    </div>

    <div
      v-else-if="authBootstrapRequired"
      role="alert"
      class="alert alert-warning alert-vertical text-left sm:alert-horizontal"
    >
      <div>
        <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold]">{{ t("setup.auth.bootstrapUnavailableTitle") }}</h3>
        <div :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("setup.auth.bootstrapUnavailableDescription") }}</div>
      </div>
    </div>

    <label v-if="authBootstrapRequired && authSetupTokenConfigured" class="floating-label text-left" :class="[FLUID_WIDTH_CLASS]">
      <span>{{ t("setup.auth.setupTokenLegend") }}</span>
      <input
        :value="authSetupToken"
        type="password"
        :placeholder="t('setup.auth.setupTokenPlaceholder')"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('setup.auth.setupTokenAria')"
        @input="updateTextValue($event, 'update:auth-setup-token')"
      />
    </label>

    <label v-if="needsStoredApiKey" class="floating-label text-left" :class="[FLUID_WIDTH_CLASS]">
      <span>{{ t("setup.auth.apiKeyLegend") }}</span>
      <input
        :value="existingApiKey"
        type="password"
        :placeholder="t('setup.auth.apiKeyPlaceholder')"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('setup.auth.apiKeyAria')"
        @input="updateTextValue($event, 'update:existing-api-key')"
      />
    </label>

    <div class="flex justify-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
      <button class="btn btn-ghost" :aria-label="t('setup.backToAiConfigAria')" @click="emit('back')">
        {{ t("setup.backButton") }}
      </button>
      <button
        class="btn btn-primary"
        :disabled="saving"
        :aria-label="t('setup.launchAria')"
        @click="emit('complete')"
      >
        <LoadingSpinner size="xs" label="Loading" v-if="saving" />
        {{ t("setup.launchButton", { brand: brandName }) }}
      </button>
    </div>
  </div>
</template>
