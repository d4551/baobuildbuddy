<script setup lang="ts">
import {
  RESUME_TEMPLATE_OPTIONS,
  type ResumeTemplate,
} from "@bao/shared/constants/resume";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_SIZE_CLASS,
  OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
  TOUCH_TARGET_MIN_CLASS,
} from "~/constants/layout";

interface ResumeEditorToolbarProps {
  readonly enhancing: boolean;
  readonly scoring: boolean;
}

const template = defineModel<ResumeTemplate>("template", { required: true });

defineProps<ResumeEditorToolbarProps>();

const emit = defineEmits<{
  back: [];
  enhance: [];
  score: [];
  export: [format: "pdf" | "docx"];
  save: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
    <button type="button" :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS]" :aria-label="t('resumePage.backButtonAria')" @click="emit('back')">
      <IconArrowLeft :class="[ICON_SIZE_CLASS[4]]"/>
      {{ t("resumePage.backButton") }}
    </button>

    <div class="flex flex-wrap items-end" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
      <fieldset class="fieldset">
        <legend class="sr-only">{{ t("resumePage.createModal.templateLegend") }}</legend>
        <select
          v-model="template"
          class="select select-sm"
          :aria-label="t('resumePage.createModal.templateAria')"
        >
          <option
            v-for="templateOption in RESUME_TEMPLATE_OPTIONS"
            :key="templateOption"
            :value="templateOption"
          >
            {{ t(`resumePage.createModal.templates.${templateOption}`) }}
          </option>
        </select>
      </fieldset>
      <button type="button" 
        :class="[OUTLINE_ACTION_CLASS]"
        :disabled="enhancing"
        :aria-label="t('resumePage.aiEnhanceButtonAria')"
        @click="emit('enhance')"
      >
        <LoadingSpinner size="xs" label="Loading" v-if="enhancing" />
        <IconBolt :class="[ICON_SIZE_CLASS[4]]" v-else/>
        {{ t("resumePage.aiEnhanceButton") }}
      </button>
      <button type="button" 
        :class="[OUTLINE_ACTION_CLASS]"
        :disabled="scoring"
        :aria-label="t('resumePage.aiScoreButtonAria')"
        @click="emit('score')"
      >
        <LoadingSpinner size="xs" label="Loading" v-if="scoring" />
        {{ t("resumePage.aiScoreButton") }}
      </button>
      <AppExportMenu 
        :button-label="t('resumePage.exportButton')"
        :button-aria-label="t('resumePage.exportButtonAria')"
        :summary-class="OUTLINE_ACTION_CLASS"
        @export="emit('export', $event)"
      />
      <button type="button" :class="[PRIMARY_ACTION_CLASS]" :aria-label="t('resumePage.saveButtonAria')" @click="emit('save')">
        {{ t("resumePage.saveButton") }}
      </button>
    </div>
  </div>
</template>
