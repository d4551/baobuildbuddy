<script setup lang="ts">
import {
  HEIGHT_48_CLASS,
  MARGIN_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
} from "~/constants/layout";

defineProps<{
  loadingLabel: string;
}>();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body items-center justify-center" :class="[HEIGHT_48_CLASS]">
      <LoadingSpinner size="lg" label="Loading" class="text-primary" />
      <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt4]">{{ loadingLabel }}</p>
    </div>
  </div>
</template>
