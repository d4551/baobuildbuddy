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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :class="iconSizes"
      class="text-primary-content"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  </div>
</template>
