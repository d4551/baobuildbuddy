<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg";
    animated?: boolean;
  }>(),
  {
    size: "md",
    animated: false,
  },
);

const sizeClasses = computed(() => {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };
  return sizes[props.size];
});

const iconSizes = computed(() => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };
  return sizes[props.size];
});
</script>

<template>
  <div
    class="rounded-full bg-primary flex items-center justify-center"
    :class="[sizeClasses, animated ? 'animate-bounce' : '']"
  >
    <IconSparkles :class="iconSizes" class="text-primary-content" />
  </div>
</template>
