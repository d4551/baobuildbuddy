<script setup lang="ts">
import { APP_BRAND } from "@navi/shared";

defineProps<{
  text: string;
  streaming: boolean;
}>();
</script>

<template>
  <div class="chat chat-end">
    <div class="chat-image avatar">
      <div class="w-10 rounded-full bg-primary flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
    </div>
    <div class="chat-header mb-1">{{ APP_BRAND.assistantName }}</div>
    <div class="chat-bubble chat-bubble-primary">
      <span v-if="!text && streaming" class="loading loading-dots loading-sm"></span>
      <template v-else>
        {{ text }}<span v-if="streaming" class="inline-block w-2 h-4 bg-primary-content ml-1 animate-pulse">|</span>
      </template>
    </div>
  </div>
</template>
