<script setup lang="ts">
const { resolvedBrand } = useBrand() as { resolvedBrand: ComputedRef<ResolvedBrandSettings> };

defineProps<{
  text: string;
  streaming: boolean;
}>();
</script>

<template>
  <div class="chat chat-end">
    <div class="chat-image avatar">
      <div class="w-10 rounded-full bg-primary flex items-center justify-center">
        <IconSparkles class="h-6 w-6 text-primary-content" />
      </div>
    </div>
    <div class="chat-header mb-1">{{ resolvedBrand.assistantName }}</div>
    <div class="chat-bubble chat-bubble-primary">
      <span v-if="!text && streaming" class="loading loading-dots loading-sm"></span>
      <template v-else>
        {{ text }}<span v-if="streaming" class="inline-block w-2 h-4 bg-primary-content ml-1 animate-pulse">|</span>
      </template>
    </div>
  </div>
</template>
