<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AppProseField from "~/components/ui/AppProseField.vue";
import {
  FONT_WEIGHT_TOKEN_CLASS,
  GHOST_ACTION_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  open: boolean;
  titleId: string;
  applying: boolean;
  jobTitle?: string;
}>();

const applicationNotes = defineModel<string>("applicationNotes", { required: true });

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [];
}>();

const { t } = useI18n();
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
      <AppProseField
        v-model="applicationNotes"
        :placeholder="t('jobDetail.applicationNotesPlaceholder')"
        :aria-label="t('jobDetail.applicationNotesAria')"
      />
    </fieldset>

    <div class="modal-action">
      <button 
        type="button"
        :class="GHOST_ACTION_CLASS"
        :aria-label="t('jobDetail.cancelApplyAria')"
        @click="emit('update:open', false)"
      >
        {{ t("jobDetail.cancelButton") }}
      </button>
      <button
        type="button"
        :class="[PRIMARY_ACTION_CLASS]"
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
