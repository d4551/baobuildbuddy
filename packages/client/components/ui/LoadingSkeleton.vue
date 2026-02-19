<script setup lang="ts">
withDefaults(
  defineProps<{
    lines?: number;
    width?: string;
  }>(),
  {
    lines: 3,
    width: "w-full",
  },
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton h-4"
      :class="[i === lines ? 'w-3/4' : width]"
    />
  </div>
</template>
