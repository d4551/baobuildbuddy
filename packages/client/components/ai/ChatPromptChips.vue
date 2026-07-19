<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { FLEX_GAP_TOKEN_CLASS } from "~/constants/layout";

withDefaults(
  defineProps<{
    prompts: readonly string[];
    loading?: boolean;
    size?: "xs" | "sm";
  }>(),
  {
    loading: false,
    size: "sm",
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
        class="btn btn-soft"
        :class="size === 'xs' ? 'btn-xs' : 'btn-sm'"
        :aria-label="t('floatingChat.suggestionAria', { prompt })"
        :disabled="loading"
        @click="emit('prompt', prompt)"
      >
        {{ prompt }}
      </button>
    </li>
  </ul>
</template>
