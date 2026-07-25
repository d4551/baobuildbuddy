<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  readonly isDirty: boolean;
  readonly findLabel: string;
  readonly undoLabel: string;
  readonly redoLabel: string;
  readonly dirtyLabel: string;
  readonly savedLabel: string;
}>();

const emit = defineEmits<{
  find: [];
  undo: [];
  redo: [];
}>();
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between border-b border-base-300 bg-base-200/60"
    :class="[FLEX_GAP_TOKEN_CLASS.gap2, PADDING_TOKEN_CLASS.px3, PADDING_TOKEN_CLASS.py2]"
  >
    <span
      class="badge badge-sm"
      :class="isDirty ? 'badge-warning' : 'badge-ghost'"
      role="status"
    >
      {{ isDirty ? dirtyLabel : savedLabel }}
    </span>
    <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
      <button
        type="button"
        :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, 'btn-sm']"
        :aria-label="undoLabel"
        @click="emit('undo')"
      >
        {{ undoLabel }}
      </button>
      <button
        type="button"
        :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, 'btn-sm']"
        :aria-label="redoLabel"
        @click="emit('redo')"
      >
        {{ redoLabel }}
      </button>
      <button
        type="button"
        :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, 'btn-sm']"
        :aria-label="findLabel"
        @click="emit('find')"
      >
        <span :class="TYPOGRAPHY_SCALE_CLASS.sm">{{ findLabel }}</span>
      </button>
    </div>
  </div>
</template>
