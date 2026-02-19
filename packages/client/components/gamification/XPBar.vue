<script setup lang="ts">
const props = defineProps<{
  xp: number;
  level: number;
  xpForNextLevel: number;
}>();

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
    }, 500);
  },
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div class="badge badge-primary badge-lg font-bold">
          Level {{ level }}
        </div>
        <span class="text-sm font-medium">
          {{ xp }} / {{ xpForNextLevel }} XP
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
    ></progress>
  </div>
</template>
