<script setup lang="ts">
import type { ChatMessage } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { CHAT_PAGE_CONTAINER_CLASS } from "~/constants/chat";
import {
  buildChatMessageRenderRows,
  createStreamingAssistantMessage,
  resolveLatestAssistantMessageIndex,
} from "~/utils/chat";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const CHAT_SCROLL_STICKY_THRESHOLD_PX = 96;

const { t, locale } = useI18n();
const { resolvedBrand } = useBrand();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("aiChatPage.seoTitle", { brand: resolvedBrand.value.name }),
    description: t("aiChatPage.seoDescription"),
  });
}

const { messages, loading, streaming, sendMessage, clearMessages, buildCurrentContext } = useAI();
const { $toast } = useNuxtApp();
const {
  speechProviderOptions,
  speechConfig,
  sttModelOptions,
  ttsModelOptions,
  speechConfigSaving,
  isSpeechConfigDirty,
  ensureSpeechConfigLoaded,
  saveSpeechConfig,
} = useSpeechModelProfiles({ locale });

const input = ref("");
const chatContainer = useTemplateRef<HTMLElement>("aiChatContainer");
const composerRef = useTemplateRef<HTMLTextAreaElement>("aiChatComposer");
const shouldStickToBottom = ref(true);

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
const renderedMessages = computed(() =>
  buildChatMessageRenderRows(messages.value as ChatMessage[]),
);
const renderedMessageSignature = computed(() =>
  renderedMessages.value
    .map(({ message }) => [message.id, message.role, message.timestamp, message.content].join(":"))
    .join("\n"),
);
const latestAssistantMessageIndex = computed(() =>
  resolveLatestAssistantMessageIndex(messages.value),
);
const streamingBubble = computed(() => createStreamingAssistantMessage("chatPage"));
const chatContext = computed(() => buildCurrentContext("chat-page"));
const hasConversation = computed(() => renderedMessages.value.length > 0 || streaming.value);
const composerStatusLabel = computed(() =>
  loading.value || streaming.value
    ? t("aiChatPage.composerBusyStatus")
    : t("aiChatPage.composerIdleStatus"),
);
const { contextChips, contextualPrompts, currentContextLabel, focusedEntityLabel } =
  useAIChatContextSummary(chatContext, t);

watch(renderedMessageSignature, () => {
  if (shouldStickToBottom.value || loading.value || streaming.value) {
    scrollToBottom(true);
  }
});

watch(streaming, (isStreaming) => {
  if (!isStreaming) {
    return;
  }

  shouldStickToBottom.value = true;
  scrollToBottom(true);
});

function updateScrollStickiness(): void {
  const container = chatContainer.value;
  if (!container) {
    return;
  }

  const remainingScrollDistance =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  shouldStickToBottom.value = remainingScrollDistance <= CHAT_SCROLL_STICKY_THRESHOLD_PX;
}

function handleChatScroll(): void {
  updateScrollStickiness();
}

function scrollToBottom(force = false): void {
  requestAnimationFrame(() => {
    const container = chatContainer.value;
    if (!container) {
      return;
    }
    if (!force && !shouldStickToBottom.value) {
      return;
    }

    container.scrollTop = container.scrollHeight;
    updateScrollStickiness();
  });
}

function focusComposer(): void {
  requestAnimationFrame(() => {
    composerRef.value?.focus();
  });
}

function handlePromptSelection(prompt: string): void {
  input.value = prompt;
  focusComposer();
}

function handleComposerKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  void handleSendMessage();
}

async function handleSendMessage() {
  if (!input.value.trim() || loading.value) return;

  if (isVoiceListening.value) {
    stopListening();
  }

  shouldStickToBottom.value = true;

  const content = input.value.trim();
  input.value = "";
  await sendMessage(content, { source: "chat-page" });
  scrollToBottom(true);
}

async function handleSaveSpeechConfig(): Promise<void> {
  const saveSpeechResult = await saveSpeechConfig(t("aiChatPage.voiceSettings.saveErrorFallback"));
  if (!saveSpeechResult.ok) {
    $toast.error(
      getErrorMessage(saveSpeechResult.error, t("aiChatPage.voiceSettings.saveErrorFallback")),
    );
    return;
  }

  if (!saveSpeechResult.saved) {
    return;
  }

  $toast.success(t("aiChatPage.voiceSettings.saveSuccess"));
}

onMounted(async () => {
  await ensureSpeechConfigLoaded();
  scrollToBottom(true);
});
</script>

<template>
  <div :class="CHAT_PAGE_CONTAINER_CLASS">
    <div class="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section class="card min-h-0 border border-base-300 bg-base-100 shadow-sm">
        <div class="flex min-h-0 flex-1 flex-col">
          <header class="border-b border-base-300 px-5 py-5 sm:px-6">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-3">
                <div>
                  <h1 class="text-3xl font-bold">
                    {{ t("aiChatPage.title", { brand: resolvedBrand.name }) }}
                  </h1>
                  <p class="text-base text-base-content/70">{{ t("aiChatPage.subtitle") }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge badge-soft badge-info">
                    {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
                  </span>
                  <span v-if="focusedEntityLabel" class="badge badge-soft badge-primary">
                    {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
                  </span>
                  <span v-for="chip in contextChips" :key="chip" class="badge badge-ghost">
                    {{ chip }}
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-sm self-start"
                :aria-label="t('aiChatPage.clearAria')"
                @click="clearMessages"
              >
                {{ t("aiChatPage.clearButton") }}
              </button>
            </div>
          </header>

          <div
            ref="aiChatContainer"
            class="min-h-0 flex-1 overflow-y-auto bg-base-200/40 px-4 py-4 sm:px-6"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            :aria-busy="loading || streaming"
            :aria-label="t('aiChatPage.logAria')"
            @scroll="handleChatScroll"
          >
            <div
              v-if="!hasConversation"
              class="flex min-h-full items-center justify-center py-8"
            >
              <div class="card w-full max-w-2xl border border-base-300 bg-base-100 shadow-sm">
                <div class="card-body gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="badge badge-soft badge-info">
                      {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
                    </span>
                    <span v-if="focusedEntityLabel" class="badge badge-soft badge-primary">
                      {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
                    </span>
                  </div>
                  <div class="space-y-2">
                    <h2 class="card-title text-xl">{{ t("aiChatPage.emptyTitle") }}</h2>
                    <p class="text-sm leading-6 text-base-content/70">
                      {{ t("aiChatPage.emptyDescription") }}
                    </p>
                  </div>
                  <ul class="flex flex-wrap gap-2" :aria-label="t('floatingChat.suggestionsAria')">
                    <li v-for="prompt in contextualPrompts" :key="prompt">
                      <button
                        type="button"
                        class="btn btn-sm btn-soft"
                        :aria-label="t('floatingChat.suggestionAria', { prompt })"
                        :disabled="loading"
                        @click="handlePromptSelection(prompt)"
                      >
                        {{ prompt }}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div v-else class="space-y-4 py-1">
              <AIChatBubble
                v-for="(messageRow, index) in renderedMessages"
                :key="messageRow.key"
                :assistant-label="resolvedBrand.assistantName"
                :context-chips="
                  index === latestAssistantMessageIndex && messageRow.message.role === 'assistant'
                    ? contextChips
                    : []
                "
                :context-chips-aria="t('floatingChat.contextChipsAria')"
                :is-latest-assistant-message="
                  index === latestAssistantMessageIndex && messageRow.message.role === 'assistant'
                "
                :is-streaming="false"
                :locale="locale"
                :message="messageRow.message"
                :user-label="t('aiChatPage.youLabel')"
              />
              <AIChatBubble
                v-if="streaming"
                :assistant-label="resolvedBrand.assistantName"
                :context-chips="contextChips"
                :context-chips-aria="t('floatingChat.contextChipsAria')"
                :is-latest-assistant-message="true"
                :is-streaming="true"
                :locale="locale"
                :message="streamingBubble"
                :user-label="t('aiChatPage.youLabel')"
              />
            </div>
          </div>

          <div class="border-t border-base-300 bg-base-100 px-4 py-4 sm:px-6">
            <form class="space-y-4" @submit.prevent="handleSendMessage">
              <div class="space-y-3">
                <label class="sr-only" for="ai-chat-composer">
                  {{ t("aiChatPage.inputAria") }}
                </label>
                <textarea
                  id="ai-chat-composer"
                  ref="aiChatComposer"
                  v-model="input"
                  rows="3"
                  class="textarea min-h-28 w-full resize-y"
                  :placeholder="t('aiChatPage.inputPlaceholder', { assistant: resolvedBrand.assistantName })"
                  :disabled="loading"
                  :aria-label="t('aiChatPage.inputAria')"
                  @keydown="handleComposerKeydown"
                />
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div class="space-y-1">
                    <p class="text-sm font-medium">
                      {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
                    </p>
                    <p class="text-xs text-base-content/70">
                      {{ t("aiChatPage.composerHint") }}
                    </p>
                  </div>
                  <div class="flex items-center justify-end gap-3">
                    <p class="text-xs text-base-content/70" role="status" aria-live="polite">
                      {{ composerStatusLabel }}
                    </p>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="!input.trim() || loading"
                      :aria-label="t('aiChatPage.sendAria')"
                    >
                      <span v-if="loading" class="loading loading-spinner loading-sm" />
                      <svg
                        v-else
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      <span>{{ t("aiChatPage.sendButton") }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <ChatVoiceControls
                v-model:selected-voice-id="selectedVoiceId"
                v-model:auto-speak-replies="autoSpeakReplies"
                v-model:stt-provider="speechConfig.sttProvider"
                v-model:stt-model="speechConfig.sttModel"
                v-model:tts-provider="speechConfig.ttsProvider"
                v-model:tts-model="speechConfig.ttsModel"
                :loading="loading"
                :supports-recognition="supportsRecognition"
                :supports-synthesis="supportsSynthesis"
                :can-replay-assistant="canReplayAssistant"
                :is-listening="isVoiceListening"
                :is-speaking="isVoiceSpeaking"
                :voices="availableVoices"
                :speech-provider-options="speechProviderOptions"
                :stt-model-options="sttModelOptions"
                :tts-model-options="ttsModelOptions"
                :speech-config-saving="speechConfigSaving"
                :support-hint-key="voiceSupportHintKey"
                :error-label="voiceErrorLabel"
                @save-speech-settings="handleSaveSpeechConfig"
                @toggle-listening="toggleListening"
                @replay-assistant="speakLatestAssistantMessage"
              />

              <p v-if="isSpeechConfigDirty" class="text-xs text-base-content/60">
                {{ t("aiChatPage.voiceSettings.unsavedHint") }}
              </p>
            </form>
          </div>
        </div>
      </section>

      <aside class="flex min-h-0 flex-col gap-4">
        <section class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body gap-3">
            <h2 class="card-title text-base">{{ t("aiChatPage.contextPanelTitle") }}</h2>
            <p class="text-sm leading-6 text-base-content/70">
              {{ t("aiChatPage.contextPanelDescription") }}
            </p>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-soft badge-info">
                {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
              </span>
              <span v-if="focusedEntityLabel" class="badge badge-soft badge-primary">
                {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
              </span>
              <span v-for="chip in contextChips" :key="`aside-${chip}`" class="badge badge-ghost">
                {{ chip }}
              </span>
            </div>
          </div>
        </section>

        <section class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body gap-3">
            <h2 class="card-title text-base">{{ t("aiChatPage.promptsTitle") }}</h2>
            <p class="text-sm leading-6 text-base-content/70">
              {{ t("aiChatPage.promptsDescription") }}
            </p>
            <ul class="flex flex-wrap gap-2" :aria-label="t('floatingChat.suggestionsAria')">
              <li v-for="prompt in contextualPrompts" :key="`sidebar-${prompt}`">
                <button
                  type="button"
                  class="btn btn-sm btn-soft"
                  :aria-label="t('floatingChat.suggestionAria', { prompt })"
                  :disabled="loading"
                  @click="handlePromptSelection(prompt)"
                >
                  {{ prompt }}
                </button>
              </li>
            </ul>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
