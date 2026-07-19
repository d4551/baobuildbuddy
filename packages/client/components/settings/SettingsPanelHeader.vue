<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  LEADING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1, TRUNCATE_FLEX_CHILD_CLASS]">
 <h2 class="font-semibold" :class="[LEADING_TOKEN_CLASS.tight, TYPOGRAPHY_SCALE_CLASS.xl]">{{ title }}</h2>
      <p v-if="description" class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.meta" class="shrink-0 self-start">
      <slot name="meta" />
    </div>
  </div>
</template>
