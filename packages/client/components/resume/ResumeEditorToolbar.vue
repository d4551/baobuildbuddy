<script setup lang="ts">
import { useI18n } from "vue-i18n";

interface ResumeEditorToolbarProps {
  readonly enhancing: boolean;
  readonly scoring: boolean;
}

defineProps<ResumeEditorToolbarProps>();

const emit = defineEmits<{
  back: [];
  enhance: [];
  score: [];
  export: [];
  save: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <button class="btn btn-ghost btn-sm" :aria-label="t('resumePage.backButtonAria')" @click="emit('back')">
      <IconArrowLeft class="h-4 w-4" />
      {{ t("resumePage.backButton") }}
    </button>

    <div class="flex flex-wrap gap-2">
      <button
        class="btn btn-sm btn-outline"
        :disabled="enhancing"
        :aria-label="t('resumePage.aiEnhanceButtonAria')"
        @click="emit('enhance')"
      >
        <span v-if="enhancing" class="loading loading-spinner loading-xs"></span>
        <IconBolt v-else class="h-4 w-4" />
        {{ t("resumePage.aiEnhanceButton") }}
      </button>
      <button
        class="btn btn-sm btn-outline"
        :disabled="scoring"
        :aria-label="t('resumePage.aiScoreButtonAria')"
        @click="emit('score')"
      >
        <span v-if="scoring" class="loading loading-spinner loading-xs"></span>
        {{ t("resumePage.aiScoreButton") }}
      </button>
      <button class="btn btn-sm btn-outline" :aria-label="t('resumePage.exportButtonAria')" @click="emit('export')">
        {{ t("resumePage.exportButton") }}
      </button>
      <button class="btn btn-sm btn-primary" :aria-label="t('resumePage.saveButtonAria')" @click="emit('save')">
        {{ t("resumePage.saveButton") }}
      </button>
    </div>
  </div>
</template>
