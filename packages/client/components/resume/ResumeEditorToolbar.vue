<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
} from "~/constants/layout";

interface ResumeEditorToolbarProps {
  readonly enhancing: boolean;
  readonly scoring: boolean;
}

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
    <button class="btn btn-ghost btn-sm" :aria-label="t('resumePage.backButtonAria')" @click="emit('back')">
      <IconArrowLeft :class="[ICON_SIZE_CLASS[4]]"/>
      {{ t("resumePage.backButton") }}
    </button>

    <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
      <button 
        class="btn btn-sm btn-outline"
        :disabled="enhancing"
        :aria-label="t('resumePage.aiEnhanceButtonAria')"
        @click="emit('enhance')"
      >
        <LoadingSpinner size="xs" label="Loading" v-if="enhancing" />
        <IconBolt :class="[ICON_SIZE_CLASS[4]]" v-else/>
        {{ t("resumePage.aiEnhanceButton") }}
      </button>
      <button 
        class="btn btn-sm btn-outline"
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
        summary-class="btn btn-sm btn-outline"
        @export="emit('export', $event)"
      />
      <button class="btn btn-primary" :aria-label="t('resumePage.saveButtonAria')" @click="emit('save')">
        {{ t("resumePage.saveButton") }}
      </button>
    </div>
  </div>
</template>
