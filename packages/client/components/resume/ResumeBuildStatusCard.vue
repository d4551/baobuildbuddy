<script setup lang="ts">
defineProps<{
  loadingLabel: string;
}>();
</script>

<template>
  <div class="card bg-base-200">
    <div class="card-body min-h-48 items-center justify-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-4 text-base-content/70">{{ loadingLabel }}</p>
    </div>
  </div>
</template>
