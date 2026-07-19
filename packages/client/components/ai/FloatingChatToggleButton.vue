<script setup lang="ts">
import {
  ICON_SIZE_CLASS,
  SHADOW_TOKEN_CLASS,
} from "~/constants/layout";

defineProps<{
  chatPanelId: string;
  isOpen: boolean;
  unreadCount: number;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <div class="indicator">
    <span
      v-if="unreadCount > 0 && !isOpen"
      class="indicator-item badge badge-error badge-sm"
      :aria-label="t('floatingChat.unreadAria', { count: unreadCount })"
    >
      {{ unreadCount }}
    </span>
    <button 
      type="button"
      class="btn btn-primary btn-circle" :class="[SHADOW_TOKEN_CLASS.lg]"
      :aria-label="isOpen ? t('floatingChat.hideAria') : t('floatingChat.showAria')"
      :aria-expanded="isOpen"
      :aria-controls="chatPanelId"
      @click="emit('toggle')"
    >
      <svg :class="[ICON_SIZE_CLASS[5]]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z"
        />
      </svg>
    </button>
  </div>
</template>
