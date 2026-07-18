<script setup lang="ts">
import {  ICON_SIZE_CLASS, SURFACE_GLASS_CARD_CLASS, MARGIN_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {  ICON_SIZE_CLASS, SURFACE_GLASS_CARD_CLASS, MARGIN_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS, useI18n } from "vue-i18n";

defineProps<{
  challenge: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
  };
}>();

const emit = defineEmits<{
  complete: [];
}>();
const { t } = useI18n();
</script>

<template>
  <div
    :class="[SURFACE_GLASS_CARD_CLASS, 'relative overflow-hidden']"
    :class="[challenge.completed ? 'glass-disabled' : 'hover: transition-shadow', SHADOW_TOKEN_CLASS.lg]"
  >
    <div
      v-if="challenge.completed"
      class="absolute inset-0 bg-success/10 flex items-center justify-center z-10"
      role="status"
      :aria-label="t('dailyChallengeCard.completedBanner')"
    >
      <div class="flex items-center text-success font-bold" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
        <IconCheckCircle :class="ICON_SIZE_CLASS['12']" />
        <span :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ t("dailyChallengeCard.completedBanner") }}</span>
      </div>
    </div>

    <div class="card-body">
      <div class="flex justify-between items-start">
        <h2 class="card-title">{{ challenge.title }}</h2>
        <div class="badge badge-accent" :class="FLEX_GAP_TOKEN_CLASS.gap1">
          <IconSparkles :class="ICON_SIZE_CLASS.xs" />
          {{ t("dashboard.dailyChallengeXpLabel", { xp: challenge.xpReward }) }}
        </div>
      </div>

      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ challenge.description }}</p>

      <div class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt4]">
        <button
          class="btn btn-primary"
          :disabled="challenge.completed"
          :aria-label="t('dailyChallengeCard.completeAria', { title: challenge.title })"
          @click="emit('complete')"
        >
          <span v-if="challenge.completed">{{ t("dailyChallengeCard.completedButton") }}</span>
          <span v-else>{{ t("dailyChallengeCard.completeButton") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
