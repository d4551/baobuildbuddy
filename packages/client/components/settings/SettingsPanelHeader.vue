<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0 space-y-1">
      <h2 class="text-xl font-semibold leading-tight">{{ title }}</h2>
      <p v-if="description" class="text-sm text-secondary">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.meta" class="shrink-0 self-start">
      <slot name="meta" />
    </div>
  </div>
</template>
