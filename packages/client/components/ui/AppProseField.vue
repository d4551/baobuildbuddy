<script setup lang="ts">
/**
 * Long-form prose field (resume/cover) — CM6 plain, non-mono, ClientOnly.
 */
import AppCodeEditor from "~/components/ui/AppCodeEditor.vue";
import { EDITOR_HOST_CLASS, EDITOR_MIN_HEIGHT_CLASS } from "~/constants/editor";
import { FLUID_WIDTH_CLASS } from "~/constants/layout";

defineProps<{
  readonly modelValue: string;
  readonly ariaLabel: string;
  readonly placeholder?: string;
  readonly minHeightClass?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function onTextareaInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  emit("update:modelValue", target.value);
}
</script>

<template>
  <div :class="[EDITOR_HOST_CLASS, FLUID_WIDTH_CLASS]">
    <ClientOnly>
      <AppCodeEditor
        :model-value="modelValue"
        mode="plain"
        :aria-label="ariaLabel"
        :placeholder="placeholder ?? ''"
        :min-height-class="minHeightClass ?? EDITOR_MIN_HEIGHT_CLASS"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <template #fallback>
        <textarea
          class="textarea"
          :class="[FLUID_WIDTH_CLASS, minHeightClass ?? EDITOR_MIN_HEIGHT_CLASS]"
          :value="modelValue"
          :aria-label="ariaLabel"
          :placeholder="placeholder"
          @input="onTextareaInput"
        />
      </template>
    </ClientOnly>
  </div>
</template>
