<script setup lang="ts">
import type { ChatMessage } from "@bao/shared";
import { APP_BRAND, APP_SEO } from "@bao/shared";

definePageMeta({
  middleware: ["auth"],
});

if (import.meta.server) {
  useServerSeoMeta({
    title: APP_SEO.chatTitle,
    description: APP_SEO.chatDescription,
  });
}

const api = useApi();

const messages = ref<ChatMessage[]>([]);
const input = ref("");
const loading = ref(false);
const streaming = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  messages.value = [
    {
      role: "assistant",
      content:
        "Hi! I'm BaoBuildBuddy, your AI career assistant for the game industry. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ];
});

async function sendMessage() {
  if (!input.value.trim() || loading.value) return;

  const userMessage = {
    role: "user",
    content: input.value,
    timestamp: new Date().toISOString(),
  };

  messages.value.push(userMessage);
  input.value = "";

  scrollToBottom();

  loading.value = true;
  streaming.value = true;

  try {
    const { data } = await api.ai.chat.post({ message: userMessage.content });

    const assistantMessage = {
      role: "assistant",
      content: data?.message || "I'm sorry, I couldn't process that request.",
      timestamp: new Date().toISOString(),
    };

    messages.value.push(assistantMessage);
  } catch {
    messages.value.push({
      role: "assistant",
      content: "I apologize, but I encountered an error. Please try again.",
      timestamp: new Date().toISOString(),
    });
  } finally {
    loading.value = false;
    streaming.value = false;
    scrollToBottom();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

function formatTime(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-12rem)]">
    <div class="mb-4">
      <h1 class="text-3xl font-bold">Chat with {{ APP_BRAND.name }}</h1>
      <p class="text-base-content/70">Your AI career assistant for the game industry</p>
    </div>

    <!-- Messages -->
    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto bg-base-200 rounded-lg p-4 mb-4 space-y-4"
    >
      <div
        v-for="(message, idx) in messages"
        :key="idx"
        class="chat"
        :class="message.role === 'user' ? 'chat-end' : 'chat-start'"
      >
        <div class="chat-image avatar">
          <div class="w-10 rounded-full" :class="message.role === 'user' ? 'bg-primary' : 'bg-secondary'">
            <div class="flex items-center justify-center h-full text-white">
              <svg v-if="message.role === 'assistant'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="chat-header mb-1">
          {{ message.role === 'user' ? 'You' : APP_BRAND.assistantName }}
          <time class="text-xs opacity-50 ml-1">{{ formatTime(message.timestamp) }}</time>
        </div>
        <div
          class="chat-bubble"
          :class="message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'"
        >
          {{ message.content }}
        </div>
      </div>

      <div v-if="streaming" class="chat chat-start">
        <div class="chat-image avatar">
          <div class="w-10 rounded-full bg-secondary">
            <div class="flex items-center justify-center h-full text-white">
              <span class="loading loading-dots loading-sm"></span>
            </div>
          </div>
        </div>
        <div class="chat-bubble chat-bubble-secondary">
          <span class="loading loading-dots loading-sm"></span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="card bg-base-200">
      <div class="card-body p-4">
        <div class="flex gap-2">
          <input
            v-model="input"
            type="text"
            placeholder="Ask BaoBuildBuddy anything about your game industry career..."
            class="input input-bordered flex-1"
            :disabled="loading"
            @keyup.enter="sendMessage"
            aria-label="Ask BaoBuildBuddy anything about your game industry career..."/>
          <button
            class="btn btn-primary"
            :disabled="!input.trim() || loading"
            @click="sendMessage"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
