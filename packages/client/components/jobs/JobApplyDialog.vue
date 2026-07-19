<script setup lang="ts">
import {
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  open: boolean;
  titleId: string;
  applying: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
  jobTitle?: string;
}>();

const applicationNotes = defineModel<string>("applicationNotes", { required: true });

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [];
}>();
</script>

<template>
  <AppModalFrame
    :open="open"
    :title-id="titleId"
    size-token="compact"
    :close-aria-label="t('jobDetail.closeApplyDialogAria')"
    :close-backdrop-label="t('jobDetail.closeButton')"
    @update:open="emit('update:open', $event)"
  >
    <h3 :id="titleId" :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.lg]">
      {{ t("jobDetail.applyDialogTitle", { title: jobTitle }) }}
    </h3>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("jobDetail.applicationNotesLegend") }}</legend>
      <textarea 
        v-model="applicationNotes"
        class="textarea" :class="[FLUID_WIDTH_CLASS]"
        rows="5"
        :placeholder="t('jobDetail.applicationNotesPlaceholder')"
        :aria-label="t('jobDetail.applicationNotesAria')"
      ></textarea>
    </fieldset>

    <div class="modal-action">
      <button 
        type="button"
        class="btn btn-ghost"
        :aria-label="t('jobDetail.cancelApplyAria')"
        @click="emit('update:open', false)"
      >
        {{ t("jobDetail.cancelButton") }}
      </button>
      <button 
        type="button"
        class="btn btn-primary"
        :aria-label="t('jobDetail.submitApplyAria')"
        :disabled="applying"
        @click="emit('submit')"
      >
        <LoadingSpinner size="xs" label="Loading" v-if="applying" />
        {{ t("jobDetail.submitButton") }}
      </button>
    </div>
  </AppModalFrame>
</template>
