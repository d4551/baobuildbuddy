<script setup lang="ts">
import { useI18n } from "vue-i18n";
/**
 * Settings JSON field — AppCodeEditor + chrome (SSOT for power JSON).
 */
import AppCodeEditor from "~/components/ui/AppCodeEditor.vue";
import AppEditorChrome from "~/components/ui/AppEditorChrome.vue";
import { EDITOR_HOST_CLASS, EDITOR_MIN_HEIGHT_CLASS } from "~/constants/editor";
import { FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";

const props = defineProps<{
  readonly label: string;
  readonly ariaLabel: string;
  readonly modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { t } = useI18n();
const codeEditorRef = ref<{
  openFind: () => void;
  runUndo: () => void;
  runRedo: () => void;
} | null>(null);

const localDirty = ref(false);
const vimOn = ref(true);
const minimapOn = ref(true);

watch(
  () => props.modelValue,
  () => {
    localDirty.value = false;
  },
);

function onUpdate(value: string): void {
  localDirty.value = true;
  emit("update:modelValue", value);
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
  <fieldset class="fieldset" :class="[FLUID_WIDTH_CLASS]">
    <legend class="fieldset-legend" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ label }}</legend>
    <div :class="[EDITOR_HOST_CLASS, MARGIN_TOKEN_CLASS.mt1]">
      <AppEditorChrome
        :is-dirty="localDirty"
        :dirty-label="t('editor.dirty')"
        :saved-label="t('editor.saved')"
        :find-label="t('editor.find')"
        :undo-label="t('editor.undo')"
        :redo-label="t('editor.redo')"
        :vim-label="t('editor.vim')"
        :minimap-label="t('editor.minimap')"
        :commands-label="t('editor.commands')"
        :vim-active="vimOn"
        :minimap-active="minimapOn"
        :show-power-toggles="true"
        @find="codeEditorRef?.openFind()"
        @undo="codeEditorRef?.runUndo()"
        @redo="codeEditorRef?.runRedo()"
        @commands="codeEditorRef?.openFind()"
        @toggle-vim="vimOn = !vimOn"
        @toggle-minimap="minimapOn = !minimapOn"
      />
      <ClientOnly>
        <AppCodeEditor
          ref="codeEditorRef"
          :model-value="modelValue"
          mode="json"
          :aria-label="ariaLabel"
          :min-height-class="EDITOR_MIN_HEIGHT_CLASS"
          :enable-vim="vimOn"
          :enable-minimap="minimapOn"
          :enable-collab="true"
          collab-channel="bao-json-editor-collab"
          @update:model-value="onUpdate"
        />
        <template #fallback>
          <textarea
            class="textarea font-mono"
            :class="[FLUID_WIDTH_CLASS, EDITOR_MIN_HEIGHT_CLASS, TYPOGRAPHY_SCALE_CLASS.xs]"
            :value="modelValue"
            :aria-label="ariaLabel"
            @input="onTextareaInput"
          />
        </template>
      </ClientOnly>
    </div>
  </fieldset>
</template>
