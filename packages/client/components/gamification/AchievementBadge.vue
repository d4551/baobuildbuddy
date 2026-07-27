<script setup lang="ts">
import { GAMIFICATION_ICON_FALLBACK } from "@bao/shared/constants/gamification-icons";
import { useI18n } from "vue-i18n";
import {
  ACHIEVEMENT_ICON_BADGE_CLASS,
  BADGE_SOFT_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
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
  <!-- SURFACE_GLASS_CARD_CLASS already carries glass-interactive; repeating it in
       the unlocked branch emitted the class twice, and on locked tiles it paired
       with glass-disabled, where hover-lift and pointer-events:none contradict. -->
  <div
    :class="[SURFACE_GLASS_CARD_CLASS, achievement.unlocked ? 'ring-2 ring-primary cursor-pointer' : 'glass-disabled']"
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
          <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold]">{{ achievement.name }}</h3>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ achievement.description }}</p>
 <span :class="[BADGE_SOFT_SM_CLASS, MARGIN_TOKEN_CLASS.mt2]">
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
