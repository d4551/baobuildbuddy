<script setup lang="ts">
import { APP_BRAND } from "@bao/shared";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  message: {
    role: string;
    content: string;
    timestamp?: string;
  };
}>();

const { t } = useI18n();
const isAssistant = computed(() => props.message.role === "assistant");
const chatClass = computed(() => (isAssistant.value ? "chat-end" : "chat-start"));
</script>

<template>
  <div class="chat" :class="chatClass">
    <div v-if="isAssistant" class="chat-image avatar">
      <div class="w-10 rounded-full bg-primary flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
    </div>
    <div v-else class="chat-image avatar placeholder">
      <div class="w-10 rounded-full bg-neutral text-neutral-content">
        <span class="text-xl">U</span>
      </div>
    </div>
    <div class="chat-header mb-1">
      {{ isAssistant ? APP_BRAND.assistantName : t("aiChatCommon.youLabel") }}
      <time v-if="message.timestamp" class="text-xs opacity-50 ml-1">{{ message.timestamp }}</time>
    </div>
    <div class="chat-bubble" :class="isAssistant ? 'chat-bubble-primary' : ''">
      {{ message.content }}
    </div>
  </div>
</template>
