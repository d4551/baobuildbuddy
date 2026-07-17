<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  currentContextLabel: string;
  focusedEntityLabel: string;
  contextChips: string[];
  contextualPrompts: string[];
  loading: boolean;
}>();

const emit = defineEmits<{
  prompt: [prompt: string];
}>();

const { t } = useI18n();
</script>

<template>
  <aside class="flex min-h-0 flex-col gap-4">
    <section class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-3">
        <h2 class="card-title text-base">{{ t("aiChatPage.contextPanelTitle") }}</h2>
        <p class="text-sm leading-6 text-secondary">
          {{ t("aiChatPage.contextPanelDescription") }}
        </p>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-soft badge-info">
            {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
          </span>
          <span v-if="focusedEntityLabel" class="badge badge-soft badge-primary">
            {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
          </span>
          <span v-for="chip in contextChips" :key="`aside-${chip}`" class="badge badge-ghost">
            {{ chip }}
          </span>
        </div>
      </div>
    </section>

    <section class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-3">
        <h2 class="card-title text-base">{{ t("aiChatPage.promptsTitle") }}</h2>
        <p class="text-sm leading-6 text-secondary">
          {{ t("aiChatPage.promptsDescription") }}
        </p>
        <ul class="flex flex-wrap gap-2" :aria-label="t('floatingChat.suggestionsAria')">
          <li v-for="prompt in contextualPrompts" :key="`sidebar-${prompt}`">
            <button
              type="button"
              class="btn btn-sm btn-soft"
              :aria-label="t('floatingChat.suggestionAria', { prompt })"
              :disabled="loading"
              @click="emit('prompt', prompt)"
            >
              {{ prompt }}
            </button>
          </li>
        </ul>
      </div>
    </section>
  </aside>
</template>
