<script setup lang="ts">
import { APP_BRAND, APP_SEO } from "@bao/shared";
import { useI18n } from "vue-i18n";

definePageMeta({
  middleware: ["auth"],
});

if (import.meta.server) {
  useServerSeoMeta({
    title: APP_SEO.chatTitle,
    description: APP_SEO.chatDescription,
  });
}

const { messages, loading, streaming, sendMessage, clearMessages } = useAI();
const { t, locale } = useI18n();

const input = ref("");
const chatContainer = ref<HTMLElement | null>(null);

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  },
);

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

async function handleSendMessage() {
  if (!input.value.trim() || loading.value) return;
  const content = input.value.trim();
  input.value = "";
  await sendMessage(content, { source: "chat-page" });
  scrollToBottom();
}

function formatTime(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleTimeString(locale.value, { hour: "numeric", minute: "2-digit" });
}
</script>

<template>
  <div class="flex flex-col min-h-[24rem] h-[calc(100dvh-12rem)]">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t("aiChatPage.title", { brand: APP_BRAND.name }) }}</h1>
        <p class="text-base-content/70">{{ t("aiChatPage.subtitle") }}</p>
      </div>
      <button class="btn btn-ghost btn-sm" :aria-label="t('aiChatPage.clearAria')" @click="clearMessages">
        {{ t("aiChatPage.clearButton") }}
      </button>
    </div>

    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto bg-base-200 rounded-lg p-4 mb-4 space-y-4"
      role="log"
      aria-live="polite"
      :aria-label="t('aiChatPage.logAria')"
    >
      <div
        v-for="(message, idx) in messages"
        :key="`${message.timestamp}-${idx}`"
        class="chat"
        :class="message.role === 'user' ? 'chat-end' : 'chat-start'"
      >
        <div
          class="chat-image avatar"
          :class="{
            'avatar-online': message.role === 'assistant' && streaming,
            'avatar-offline': message.role === 'assistant' && !streaming,
          }"
        >
          <div class="w-10 rounded-full" :class="message.role === 'user' ? 'bg-primary' : 'bg-secondary'">
            <div
              class="flex h-full items-center justify-center"
              :class="message.role === 'user' ? 'text-primary-content' : 'text-secondary-content'"
            >
              <svg v-if="message.role === 'assistant'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="chat-header mb-1">
          {{ message.role === 'user' ? t("aiChatPage.youLabel") : APP_BRAND.assistantName }}
          <time class="text-xs opacity-50 ml-1">{{ formatTime(message.timestamp) }}</time>
        </div>

        <div class="chat-bubble" :class="message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'">
          {{ message.content }}
        </div>
      </div>

      <div v-if="streaming" class="chat chat-start">
        <div class="chat-image avatar avatar-online">
          <div class="w-10 rounded-full bg-secondary">
            <div class="flex h-full items-center justify-center text-secondary-content">
              <span class="loading loading-dots loading-sm"></span>
            </div>
          </div>
        </div>
        <div class="chat-bubble chat-bubble-secondary">
          <span class="loading loading-dots loading-sm"></span>
        </div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body p-4">
        <div class="flex gap-2">
          <input
            v-model="input"
            type="text"
            :placeholder="t('aiChatPage.inputPlaceholder')"
            class="input input-bordered flex-1"
            :disabled="loading"
            :aria-label="t('aiChatPage.inputAria')"
            @keyup.enter="handleSendMessage"
          />
          <button
            class="btn btn-primary"
            :disabled="!input.trim() || loading"
            :aria-label="t('aiChatPage.sendAria')"
            @click="handleSendMessage"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
