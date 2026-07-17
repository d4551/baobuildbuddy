<script setup lang="ts">
import { GAMIFICATION_ICON_FALLBACK } from "@bao/shared/constants/gamification-icons";
import { useI18n } from "vue-i18n";

defineProps<{
  achievement: {
    id: string;
    name: string;
    description: string;
    icon?: string | null;
    unlocked: boolean;
    xpReward: number;
  };
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="card card-border card-glass transition-all"
    :class="[
      achievement.unlocked
        ? 'ring-2 ring-primary cursor-pointer hover:shadow-lg'
        : 'glass-disabled'
    ]"
    :title="achievement.description"
    :aria-label="t('gamificationPage.achievementBadgeAria', { name: achievement.name, description: achievement.description })"
  >
    <div class="card-body p-4">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center"
          :class="achievement.unlocked ? 'bg-primary text-primary-content' : 'bg-base-300 text-muted'"
        >
          <span class="text-2xl" aria-hidden="true">
            {{ achievement.icon ?? GAMIFICATION_ICON_FALLBACK }}
          </span>
        </div>

        <div class="flex-1">
          <h3 class="font-bold">{{ achievement.name }}</h3>
          <p class="text-xs text-secondary">{{ achievement.description }}</p>
          <span class="badge badge-soft badge-sm mt-2">
            +{{ achievement.xpReward }} {{ t("gamificationPage.xpSuffix") }}
          </span>
        </div>

        <div v-if="achievement.unlocked" class="text-success">
          <IconCheckCircle class="h-6 w-6" />
        </div>
      </div>
    </div>
  </div>
</template>
