<script setup lang="ts">
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
    <h3 :id="titleId" class="mb-4 text-lg font-bold">
      {{ t("jobDetail.applyDialogTitle", { title: jobTitle }) }}
    </h3>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("jobDetail.applicationNotesLegend") }}</legend>
      <textarea
        v-model="applicationNotes"
        class="textarea w-full"
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
        <span v-if="applying" class="loading loading-spinner loading-xs"></span>
        {{ t("jobDetail.submitButton") }}
      </button>
    </div>
  </AppModalFrame>
</template>
