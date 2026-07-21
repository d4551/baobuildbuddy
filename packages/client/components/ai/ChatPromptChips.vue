<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  SOFT_ACTION_CLASS,
} from "~/constants/layout-action-soft";

withDefaults(
  defineProps<{
    prompts: readonly string[];
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  prompt: [prompt: string];
}>();

const { t } = useI18n();
</script>

<template>
  <ul class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]" :aria-label="t('floatingChat.suggestionsAria')">
    <li v-for="prompt in prompts" :key="prompt">
      <button
        type="button"
        :class="[SOFT_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, TYPOGRAPHY_SCALE_CLASS.xs]"
        :aria-label="t('floatingChat.suggestionAria', { prompt })"
        :disabled="loading"
        @click="emit('prompt', prompt)"
      >
        {{ prompt }}
      </button>
    </li>
  </ul>
</template>
