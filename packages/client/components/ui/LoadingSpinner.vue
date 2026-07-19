<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: "xs" | "sm" | "md" | "lg";
    label: string;
  }>(),
  {
    size: "sm",
  },
);
</script>

<template>
  <span 
    :class="['loading loading-spinner', `loading-${size}`]"
    role="status"
    :aria-label="label"
  />
</template>
