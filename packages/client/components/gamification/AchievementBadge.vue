<script setup lang="ts">
import { GAMIFICATION_ICON_FALLBACK } from "@bao/shared/constants/gamification-icons";
import { useI18n } from "vue-i18n";
import {
  ACHIEVEMENT_ICON_BADGE_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
    :class="[SURFACE_GLASS_CARD_CLASS, achievement.unlocked ? 'glass-interactive ring-2 ring-primary cursor-pointer' : 'glass-disabled']"
    :title="achievement.description"
    :aria-label="t('gamificationPage.achievementBadgeAria', { name: achievement.name, description: achievement.description })"
  >
    <div class="card-body" :class="[PADDING_TOKEN_CLASS.p4]">
      <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div
          :class="[ACHIEVEMENT_ICON_BADGE_CLASS, achievement.unlocked ? 'bg-primary text-primary-content' : 'bg-base-300 text-muted']"
        >
          <span :class="[TYPOGRAPHY_SCALE_CLASS.xl2]" aria-hidden="true">
            {{ achievement.icon ?? GAMIFICATION_ICON_FALLBACK }}
          </span>
        </div>

        <div class="flex-1">
          <h3 class="font-bold">{{ achievement.name }}</h3>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ achievement.description }}</p>
          <span class="badge badge-soft badge-sm" :class="[MARGIN_TOKEN_CLASS.mt2]">
            +{{ achievement.xpReward }} {{ t("gamificationPage.xpSuffix") }}
          </span>
        </div>

        <div v-if="achievement.unlocked" class="text-success">
          <IconCheckCircle :class="ICON_SIZE_CLASS.md" />
        </div>
      </div>
    </div>
  </div>
</template>
