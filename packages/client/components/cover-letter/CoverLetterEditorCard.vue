<script setup lang="ts">
import AppBlockEditor from "~/components/ui/AppBlockEditor.vue";
import AppEditorChrome from "~/components/ui/AppEditorChrome.vue";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import { EDITOR_HOST_CLASS, EDITOR_WRITING_MIN_HEIGHT_CLASS } from "~/constants/editor";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  contentCharacterCount: number;
  t: (key: string, values?: Record<string, unknown>) => string;
  isDirty?: boolean;
}>();

const contentText = defineModel<string>("contentText", { required: true });

const emit = defineEmits<{
  clear: [];
  save: [];
  edited: [];
}>();

const previewParagraphs = computed(() =>
  contentText.value
    .split(/\n{2,}/u)
    .map((block) => block.trim())
    .filter((block) => block.length > 0),
);

function onUpdate(value: string): void {
  contentText.value = value;
  emit("edited");
}

function onTextareaInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  onUpdate(target.value);
}
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <h2 class="card-title">{{ t("coverLetterDetailPage.editor.title") }}</h2>

      <div class="alert alert-info alert-soft" role="status">
        <IconInfoCircle :class="[ICON_SIZE_CLASS[5]]" />
        <span>{{ t("coverLetterDetailPage.editor.info") }}</span>
      </div>

      <SectionGrid grid-token="twoColumn">
        <div :class="[EDITOR_HOST_CLASS, FLUID_WIDTH_CLASS]">
          <AppEditorChrome
            :is-dirty="Boolean(isDirty)"
            :dirty-label="t('editor.dirty')"
            :saved-label="t('editor.saved')"
            :find-label="t('editor.find')"
            :undo-label="t('editor.undo')"
            :redo-label="t('editor.redo')"
          />
          <ClientOnly>
            <AppBlockEditor
              :model-value="contentText"
              :aria-label="t('coverLetterDetailPage.editor.aria')"
              @update:model-value="onUpdate"
            />
            <template #fallback>
              <textarea
                class="textarea"
                :class="[FLUID_WIDTH_CLASS, EDITOR_WRITING_MIN_HEIGHT_CLASS]"
                :value="contentText"
                :aria-label="t('coverLetterDetailPage.editor.aria')"
                @input="onTextareaInput"
              />
            </template>
          </ClientOnly>
        </div>

        <div
          class="rounded-box border border-base-300 bg-base-200/40"
          :class="[EDITOR_WRITING_MIN_HEIGHT_CLASS, PADDING_TOKEN_CLASS.p4]"
          aria-live="polite"
        >
          <h3 class="font-semibold" :class="[MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("coverLetterDetailPage.preview.title") }}
          </h3>
          <div v-if="previewParagraphs.length === 0" class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("coverLetterDetailPage.preview.empty") }}
          </div>
          <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
            <p
              v-for="(paragraph, index) in previewParagraphs"
              :key="index"
              class="whitespace-pre-wrap"
              :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </SectionGrid>

      <div
        class="flex flex-wrap items-center justify-between"
        :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mt2]"
      >
        <span class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("coverLetterDetailPage.editor.characterCount", { count: contentCharacterCount }) }}
        </span>
        <div class="flex" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <button
            :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS]"
            :aria-label="t('coverLetterDetailPage.editor.clearAria')"
            @click="emit('clear')"
          >
            {{ t("coverLetterDetailPage.editor.clearButton") }}
          </button>
          <button
            :class="[PRIMARY_ACTION_CLASS]"
            :aria-label="t('coverLetterDetailPage.editor.saveAria')"
            @click="emit('save')"
          >
            {{ t("coverLetterDetailPage.editor.saveButton") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
