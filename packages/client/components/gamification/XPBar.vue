<script setup lang="ts">
import { XP_BAR_ANIMATION_DURATION_MS } from "~/constants/gamification";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  xp: number;
  level: number;
  xpForNextLevel: number;
}>();
const { t } = useI18n();

const xpProgress = computed(() => {
  return Math.min((props.xp / props.xpForNextLevel) * 100, 100);
});

const xpPercentage = computed(() => {
  return Math.round(xpProgress.value);
});

// Animation trigger when XP changes
const isAnimating = ref(false);
watch(
  () => props.xp,
  () => {
    isAnimating.value = true;
    setTimeout(() => {
      isAnimating.value = false;
    }, XP_BAR_ANIMATION_DURATION_MS);
  },
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div class="badge badge-primary badge-lg font-bold">
          {{ t("xpBar.levelBadge", { level }) }}
        </div>
        <span class="text-sm font-medium">
          {{ t("xpBar.progressLabel", { xp, xpForNextLevel }) }}
        </span>
      </div>
      <span class="text-sm text-base-content/70">
        {{ xpPercentage }}%
      </span>
    </div>

    <progress
      class="progress progress-primary w-full"
      :class="{ 'animate-pulse': isAnimating }"
      :value="xpProgress"
      max="100"
      :aria-label="t('xpBar.progressAria', { progress: xpPercentage })"></progress>
  </div>
</template>
