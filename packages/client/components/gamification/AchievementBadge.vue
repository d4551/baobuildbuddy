<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  achievement: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    unlocked: boolean;
  };
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="card bg-base-100 shadow-md hover:shadow-lg transition-all"
    :class="[
      achievement.unlocked
        ? 'ring-2 ring-primary cursor-pointer'
        : 'opacity-50 grayscale'
    ]"
    :title="achievement.description"
    :aria-label="t('gamificationPage.achievementBadgeAria', { name: achievement.name, description: achievement.description })"
  >
    <div class="card-body p-4">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center"
          :class="achievement.unlocked ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'"
        >
          <template v-if="achievement.icon">
            {{ achievement.icon }}
          </template>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        <div class="flex-1">
          <h3 class="font-bold">{{ achievement.name }}</h3>
          <p class="text-xs text-base-content/70">{{ achievement.description }}</p>
        </div>

        <div v-if="achievement.unlocked" class="text-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
