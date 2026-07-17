<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    max?: number;
    sizeClass?: string;
    trackClass?: string;
    fillClass?: string;
    ariaLabel: string;
  }>(),
  {
    max: 100,
    sizeClass: "h-24 w-24",
    trackClass: "stroke-base-300",
    fillClass: "stroke-primary",
  },
);

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const clampedValue = computed(() => {
  const max = props.max > 0 ? props.max : 100;
  const raw = Number.isFinite(props.value) ? props.value : 0;
  return Math.min(max, Math.max(0, raw));
});

const dashOffset = computed(() => {
  const max = props.max > 0 ? props.max : 100;
  const progress = clampedValue.value / max;
  return CIRCUMFERENCE * (1 - progress);
});
</script>

<template>
  <div
    class="relative inline-flex items-center justify-center"
    :class="sizeClass"
    role="progressbar"
    :aria-label="ariaLabel"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="clampedValue"
  >
    <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
      <circle
        class="fill-none"
        :class="trackClass"
        cx="50"
        cy="50"
        :r="RADIUS"
        stroke-width="8"
      />
      <circle
        class="fill-none transition-[stroke-dashoffset] duration-300"
        :class="fillClass"
        cx="50"
        cy="50"
        :r="RADIUS"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <slot />
    </div>
  </div>
</template>
