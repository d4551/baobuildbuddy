<script setup lang="ts">
import { MARGIN_TOKEN_CLASS } from "~/constants/layout";
defineProps<{
  loadingLabel: string;
}>();
</script>

<template>
  <div class="card bg-base-200">
    <div class="card-body min-h-48 items-center justify-center">
      <LoadingSpinner size="lg" label="Loading" class="text-primary" />
      <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt4]">{{ loadingLabel }}</p>
    </div>
  </div>
</template>
