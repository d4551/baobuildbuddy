<script setup lang="ts">
import { SURFACE_GLASS_CARD_CLASS, MARGIN_TOKEN_CLASS } from "~/constants/layout";

defineProps<{
  loadingLabel: string;
}>();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body min-h-48 items-center justify-center">
      <LoadingSpinner size="lg" label="Loading" class="text-primary" />
      <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt4]">{{ loadingLabel }}</p>
    </div>
  </div>
</template>
