<script setup lang="ts">
import { APP_BRAND, APP_SEO } from "@bao/shared";
import { useI18n } from "vue-i18n";
import {
  buildChatMessageRenderRows,
  createStreamingAssistantMessage,
  resolveLatestAssistantMessageIndex,
} from "~/utils/chat";

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
const chatContainer = useTemplateRef<HTMLElement>("aiChatContainer");
const {
  autoSpeakReplies,
  canReplayAssistant,
  errorMessageKey: voiceErrorMessageKey,
  supportHintKey: voiceSupportHintKey,
  isListening: isVoiceListening,
  isSpeaking: isVoiceSpeaking,
  supportsRecognition,
  supportsSynthesis,
  selectedVoiceId,
  voices: availableVoices,
  speakLatestAssistantMessage,
  stopListening,
  toggleListening,
} = useChatVoice({
  draft: input,
  locale,
  messages,
});
const voiceErrorLabel = computed(() => {
  if (voiceErrorMessageKey.value.length === 0) {
    return "";
  }

  return t("aiChatCommon.voice.errorLabel", { error: t(voiceErrorMessageKey.value) });
});
const renderedMessages = computed(() => buildChatMessageRenderRows(messages.value));
const latestAssistantMessageIndex = computed(() =>
  resolveLatestAssistantMessageIndex(messages.value),
);
const streamingBubble = computed(() => createStreamingAssistantMessage("chatPage"));

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  },
);
watch(streaming, () => {
  if (streaming.value) {
    scrollToBottom();
  }
});

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

async function handleSendMessage() {
  if (!input.value.trim() || loading.value) return;

  if (isVoiceListening.value) {
    stopListening();
  }

  const content = input.value.trim();
  input.value = "";
  await sendMessage(content, { source: "chat-page" });
  scrollToBottom();
}
</script>

<template>
  <div class="flex flex-col min-h-[24rem] h-[calc(100dvh-12rem)]">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t("aiChatPage.title", { brand: APP_BRAND.name }) }}</h1>
        <p class="text-base-content/70">{{ t("aiChatPage.subtitle") }}</p>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :aria-label="t('aiChatPage.clearAria')"
        @click="clearMessages"
      >
        {{ t("aiChatPage.clearButton") }}
      </button>
    </div>

    <div
      ref="aiChatContainer"
      class="flex-1 overflow-y-auto bg-base-200 rounded-lg p-4 mb-4 space-y-4"
      role="log"
      aria-live="polite"
      :aria-busy="loading || streaming"
      :aria-label="t('aiChatPage.logAria')"
    >
      <AIChatBubble
        v-for="(messageRow, index) in renderedMessages"
        :key="messageRow.key"
        :assistant-label="APP_BRAND.assistantName"
        :is-latest-assistant-message="
          index === latestAssistantMessageIndex && messageRow.message.role === 'assistant'
        "
        :is-streaming="false"
        :locale="locale.value"
        :message="messageRow.message"
        :user-label="t('aiChatPage.youLabel')"
      />
      <AIChatBubble
        v-if="streaming"
        :assistant-label="APP_BRAND.assistantName"
        :is-latest-assistant-message="true"
        :is-streaming="true"
        :locale="locale.value"
        :message="streamingBubble"
        :user-label="t('aiChatPage.youLabel')"
      />
    </div>

    <div class="card bg-base-200">
      <form class="card-body p-4" @submit.prevent="handleSendMessage">
        <div class="join w-full">
          <input
            v-model="input"
            type="text"
            :placeholder="t('aiChatPage.inputPlaceholder')"
            class="input input-bordered join-item flex-1"
            :disabled="loading"
            :aria-label="t('aiChatPage.inputAria')"
          />
          <ChatVoiceControls
            v-model:selected-voice-id="selectedVoiceId"
            v-model:auto-speak-replies="autoSpeakReplies"
            :loading="loading"
            :supports-recognition="supportsRecognition"
            :supports-synthesis="supportsSynthesis"
            :can-replay-assistant="canReplayAssistant"
            :is-listening="isVoiceListening"
            :is-speaking="isVoiceSpeaking"
            :voices="availableVoices"
            :support-hint-key="voiceSupportHintKey"
            :error-label="voiceErrorLabel"
            @toggle-listening="toggleListening"
            @replay-assistant="speakLatestAssistantMessage"
          />
          <button
            type="submit"
            class="btn btn-primary join-item"
            :disabled="!input.trim() || loading"
            :aria-label="t('aiChatPage.sendAria')"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
