<script setup lang="ts">
import {

  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  TOUCH_TARGET_MIN_CLASS,
} from "~/constants/layout";

defineProps<{
  contentCharacterCount: number;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const contentText = defineModel<string>("contentText", { required: true });

const emit = defineEmits<{
  clear: [];
  save: [];
}>();
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <h2 class="card-title">{{ t("coverLetterDetailPage.editor.title") }}</h2>

      <div class="alert alert-info alert-soft" role="status">
        <IconInfoCircle :class="[ICON_SIZE_CLASS[5]]"/>
        <span>{{ t("coverLetterDetailPage.editor.info") }}</span>
      </div>

      <textarea 
        v-model="contentText"
        class="textarea font-mono" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.sm]"
        rows="20"
        :placeholder="t('coverLetterDetailPage.editor.placeholder')"
        :aria-label="t('coverLetterDetailPage.editor.aria')"
      ></textarea>

      <div class="flex flex-wrap items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mt4]">
        <span class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("coverLetterDetailPage.editor.characterCount", { count: contentCharacterCount }) }}
        </span>
        <div class="flex" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <button class="btn btn-sm btn-ghost" :class="[TOUCH_TARGET_MIN_CLASS]" :aria-label="t('coverLetterDetailPage.editor.clearAria')" @click="emit('clear')">
            {{ t("coverLetterDetailPage.editor.clearButton") }}
          </button>
          <button class="btn btn-primary" :aria-label="t('coverLetterDetailPage.editor.saveAria')" @click="emit('save')">
            {{ t("coverLetterDetailPage.editor.saveButton") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
