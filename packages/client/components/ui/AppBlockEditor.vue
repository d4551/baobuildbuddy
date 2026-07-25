<script setup lang="ts">
/**
 * TipTap block editor for structured prose (cover letters). ClientOnly host.
 */
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { EDITOR_HOST_CLASS, EDITOR_WRITING_MIN_HEIGHT_CLASS } from "~/constants/editor";
import { FLUID_WIDTH_CLASS } from "~/constants/layout";

const props = defineProps<{
  readonly modelValue: string;
  readonly ariaLabel: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit],
  editorProps: {
    attributes: {
      "aria-label": props.ariaLabel,
      class: `${EDITOR_WRITING_MIN_HEIGHT_CLASS} focus:outline-none`,
      role: "textbox",
    },
  },
  onUpdate: ({ editor: instance }) => {
    emit("update:modelValue", instance.getText({ blockSeparator: "\n\n" }));
  },
});

watch(
  () => props.modelValue,
  (next) => {
    if (!editor.value) {
      return;
    }
    const current = editor.value.getText({ blockSeparator: "\n\n" });
    if (next === current) {
      return;
    }
    editor.value.commands.setContent(next);
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div
    :class="[EDITOR_HOST_CLASS, FLUID_WIDTH_CLASS, EDITOR_WRITING_MIN_HEIGHT_CLASS]"
    data-testid="app-block-editor"
  >
    <EditorContent :editor="editor" />
  </div>
</template>
