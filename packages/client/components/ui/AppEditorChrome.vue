<script setup lang="ts">
import {
  BADGE_SM_CLASS,
  BADGE_VARIANT_CLASS,
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
  readonly vimLabel?: string;
  readonly minimapLabel?: string;
  readonly commandsLabel?: string;
  readonly vimActive?: boolean;
  readonly minimapActive?: boolean;
  readonly showPowerToggles?: boolean;
}>();

const emit = defineEmits<{
  find: [];
  undo: [];
  redo: [];
  toggleVim: [];
  toggleMinimap: [];
  commands: [];
}>();
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between border-b border-base-300 bg-base-200/60"
    :class="[FLEX_GAP_TOKEN_CLASS.gap2, PADDING_TOKEN_CLASS.px3, PADDING_TOKEN_CLASS.py2]"
  >
    <span
 
 :class="[BADGE_SM_CLASS, isDirty ? BADGE_VARIANT_CLASS.warning : BADGE_VARIANT_CLASS.ghost]"
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
      <button
        v-if="commandsLabel"
        type="button"
        :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, 'btn-sm']"
        :aria-label="commandsLabel"
        data-testid="editor-commands"
        @click="emit('commands')"
      >
        <span :class="TYPOGRAPHY_SCALE_CLASS.sm">{{ commandsLabel }}</span>
      </button>
      <button
        v-if="showPowerToggles && vimLabel"
        type="button"
        :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, 'btn-sm', vimActive ? 'btn-active' : '']"
        :aria-label="vimLabel"
        :aria-pressed="vimActive ? 'true' : 'false'"
        data-testid="editor-vim-toggle"
        @click="emit('toggleVim')"
      >
        <span :class="TYPOGRAPHY_SCALE_CLASS.sm">{{ vimLabel }}</span>
      </button>
      <button
        v-if="showPowerToggles && minimapLabel"
        type="button"
        :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, 'btn-sm', minimapActive ? 'btn-active' : '']"
        :aria-label="minimapLabel"
        :aria-pressed="minimapActive ? 'true' : 'false'"
        data-testid="editor-minimap-toggle"
        @click="emit('toggleMinimap')"
      >
        <span :class="TYPOGRAPHY_SCALE_CLASS.sm">{{ minimapLabel }}</span>
      </button>
    </div>
  </div>
</template>
