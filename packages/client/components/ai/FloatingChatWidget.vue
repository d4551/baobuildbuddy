<script setup lang="ts">
import {
  AI_CHAT_PAGE_PATH,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { FLOATING_CHAT_PANEL_SIZE_CLASS } from "~/constants/chat";
import { FLOATING_CHAT_PANEL_ID } from "~/constants/layout";
import {
  buildChatMessageRenderRows,
  createStreamingAssistantMessage,
  resolveLatestAssistantMessageIndex,
} from "~/utils/chat";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const { messages, loading, streaming, sendMessage, clearMessages, buildCurrentContext } = useAI();
const { $toast } = useNuxtApp();
const { t, locale } = useI18n();
const { resolvedBrand } = useBrand();
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

const isOpen = ref(false);
const isSpeechSettingsOpen = ref(false);
const draft = ref("");
const unreadCount = ref(0);
const panelBodyRef = useTemplateRef<HTMLElement>("floatingChatPanelBody");
const inputRef = useTemplateRef<HTMLTextAreaElement>("floatingChatInput");
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
  draft,
  locale,
  messages,
});
const chatPanelId = FLOATING_CHAT_PANEL_ID;
const voiceErrorLabel = computed(() => {
  if (voiceErrorMessageKey.value.length === 0) {
    return "";
  }

  return t("aiChatCommon.voice.errorLabel", { error: t(voiceErrorMessageKey.value) });
});
const chatContext = computed(() => buildCurrentContext("floating-widget"));
const renderedMessages = computed(() => buildChatMessageRenderRows(messages.value));
const renderedMessageSignature = computed(() =>
  renderedMessages.value
    .map(({ message }) => [message.id, message.role, message.timestamp, message.content].join(":"))
    .join("\n"),
);
const latestAssistantMessageIndex = computed(() =>
  resolveLatestAssistantMessageIndex(messages.value),
);
const streamingBubble = computed(() => createStreamingAssistantMessage("floatingWidget"));
const { contextChips, contextualPrompts, currentContextLabel, focusedEntityLabel } =
  useAIChatContextSummary(chatContext, t);
const hasConversation = computed(() => renderedMessages.value.length > 0 || streaming.value);

const showWidget = computed(() => !route.path.startsWith(AI_CHAT_PAGE_PATH));

watch(showWidget, (visible) => {
  if (!visible) {
    isOpen.value = false;
    isSpeechSettingsOpen.value = false;
    unreadCount.value = 0;
  }
});

watch(
  () => messages.value.length,
  (nextCount, previousCount) => {
    if (isOpen.value) {
      unreadCount.value = 0;
      scrollToBottom(true);
      return;
    }

    if (nextCount > previousCount) {
      unreadCount.value += nextCount - previousCount;
    }
  },
);
watch(renderedMessageSignature, () => {
  if (!isOpen.value) {
    return;
  }

  if (shouldStickToBottom.value || streaming.value || loading.value) {
    scrollToBottom(true);
  }
});

watch(streaming, () => {
  if (streaming.value && isOpen.value) {
    shouldStickToBottom.value = true;
    scrollToBottom(true);
  }
});

watch(isOpen, (open) => {
  if (!open) {
    isSpeechSettingsOpen.value = false;
    return;
  }
  unreadCount.value = 0;
  shouldStickToBottom.value = true;
  scrollToBottom(true);
  requestAnimationFrame(() => {
    inputRef.value?.focus();
  });
});

function updateScrollStickiness(): void {
  const panelBody = panelBodyRef.value;
  if (!panelBody) return;
  const remainingScrollDistance =
    panelBody.scrollHeight - panelBody.scrollTop - panelBody.clientHeight;
  shouldStickToBottom.value = remainingScrollDistance <= 96;
}

function handlePanelScroll(): void {
  updateScrollStickiness();
}

function scrollToBottom(force = false) {
  requestAnimationFrame(() => {
    const panelBody = panelBodyRef.value;
    if (!panelBody) return;
    if (!force && !shouldStickToBottom.value) return;
    panelBody.scrollTop = panelBody.scrollHeight;
    updateScrollStickiness();
  });
}

function toggleWidget() {
  isOpen.value = !isOpen.value;
}

function closeWidget() {
  isOpen.value = false;
}

function toggleSpeechSettings(): void {
  isSpeechSettingsOpen.value = !isSpeechSettingsOpen.value;
}

function handleFocusChatShortcut() {
  isOpen.value = true;
  unreadCount.value = 0;
  requestAnimationFrame(() => {
    inputRef.value?.focus();
  });
}

function onFocusChatShortcut() {
  handleFocusChatShortcut();
}

async function handleSendMessage() {
  if (!draft.value.trim() || loading.value) return;

  if (isVoiceListening.value) {
    stopListening();
  }

  shouldStickToBottom.value = true;
  const content = draft.value.trim();
  draft.value = "";
  await sendMessage(content, { source: "floating-widget" });
  scrollToBottom(true);
}

async function handleSaveSpeechConfig(): Promise<void> {
  const saveSpeechResult = await saveSpeechConfig(
    t("floatingChat.voiceSettings.saveErrorFallback"),
  );
  if (!saveSpeechResult.ok) {
    $toast.error(
      getErrorMessage(saveSpeechResult.error, t("floatingChat.voiceSettings.saveErrorFallback")),
    );
    return;
  }

  if (!saveSpeechResult.saved) {
    return;
  }

  $toast.success(t("floatingChat.voiceSettings.saveSuccess"));
}

function handlePromptInput(prompt: string): void {
  draft.value = prompt;
  requestAnimationFrame(() => {
    inputRef.value?.focus();
  });
}

function handleDraftKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  void handleSendMessage();
}

onMounted(async () => {
  await ensureSpeechConfigLoaded();
  window.addEventListener("bao:focus-chat", onFocusChatShortcut);
});

onUnmounted(() => {
  window.removeEventListener("bao:focus-chat", onFocusChatShortcut);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showWidget"
      class="fixed z-[60] bottom-24 right-4 lg:bottom-6 lg:right-6 flex flex-col items-end gap-3"
    >
      <div
        v-if="isOpen"
        :id="chatPanelId"
        class="card border border-base-300 bg-base-100 shadow-xl"
        :class="FLOATING_CHAT_PANEL_SIZE_CLASS"
      >
        <div class="card-body p-0 h-full">
          <header class="flex items-center justify-between p-3 border-b border-base-300">
            <div>
              <h2 class="font-semibold text-sm">{{ resolvedBrand.assistantName }}</h2>
              <div class="mt-1 flex items-center gap-2">
                <p class="text-xs text-base-content/60">{{ t("floatingChat.subtitle") }}</p>
                <span
                  class="badge badge-soft badge-info badge-xs"
                  :aria-label="t('floatingChat.contextAria', { context: currentContextLabel })"
                >
                  {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
                </span>
                <span
                  v-if="focusedEntityLabel"
                  class="badge badge-soft badge-primary badge-xs"
                  :aria-label="t('floatingChat.focusedEntityAria', { entity: focusedEntityLabel })"
                >
                  {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
                </span>
              </div>
              <ul
                v-if="contextChips.length > 0"
                class="mt-2 flex flex-wrap gap-2"
                :aria-label="t('floatingChat.contextChipsAria')"
              >
                <li v-for="chip in contextChips" :key="chip">
                  <span class="badge badge-ghost badge-xs">{{ chip }}</span>
                </li>
              </ul>
            </div>
            <div class="flex items-center gap-1">
              <NuxtLink
                :to="AI_CHAT_PAGE_PATH"
                class="btn btn-ghost btn-xs"
                :aria-label="t('floatingChat.expandAria')"
              >
                {{ t("floatingChat.expandButton") }}
              </NuxtLink>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                :aria-label="t('floatingChat.voiceSettings.toggleAria')"
                :aria-expanded="isSpeechSettingsOpen"
                @click="toggleSpeechSettings"
              >
                {{ t("floatingChat.voiceSettings.toggleButton") }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                :aria-label="t('floatingChat.clearAria')"
                @click="clearMessages"
              >
                {{ t("floatingChat.clearButton") }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                :aria-label="t('floatingChat.closeAria')"
                @click="closeWidget"
              >
                <CloseIcon class="h-4 w-4" />
              </button>
            </div>
          </header>

          <div class="border-b border-base-300 px-3 py-2">
            <ul class="flex flex-wrap gap-2" :aria-label="t('floatingChat.suggestionsAria')">
              <li v-for="prompt in contextualPrompts" :key="prompt">
                <button
                  type="button"
                  class="btn btn-xs btn-soft"
                  :aria-label="t('floatingChat.suggestionAria', { prompt })"
                  :disabled="loading"
                  @click="handlePromptInput(prompt)"
                >
                  {{ prompt }}
                </button>
              </li>
            </ul>
          </div>

          <div
            ref="floatingChatPanelBody"
            class="flex-1 overflow-y-auto p-3 space-y-3"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            :aria-label="t('floatingChat.logAria')"
            :aria-busy="loading || streaming"
            @scroll="handlePanelScroll"
          >
            <div v-if="!hasConversation" class="flex h-full min-h-60 items-center justify-center">
              <div class="card w-full border border-base-300 bg-base-200/60 shadow-sm">
                <div class="card-body gap-3 p-4">
                  <h3 class="card-title text-base">{{ t("floatingChat.emptyTitle") }}</h3>
                  <p class="text-sm leading-6 text-base-content/70">
                    {{ t("floatingChat.emptyDescription") }}
                  </p>
                </div>
              </div>
            </div>
            <template v-else>
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
                :locale="locale.value"
                :message="messageRow.message"
                :user-label="t('floatingChat.youLabel')"
              />
              <AIChatBubble
                v-if="streaming"
                :assistant-label="resolvedBrand.assistantName"
                :context-chips="contextChips"
                :context-chips-aria="t('floatingChat.contextChipsAria')"
                :is-latest-assistant-message="true"
                :is-streaming="true"
                :locale="locale.value"
                :message="streamingBubble"
                :user-label="t('floatingChat.youLabel')"
              />
            </template>
          </div>

          <div class="p-3 border-t border-base-300">
            <form class="space-y-3" @submit.prevent="handleSendMessage">
              <textarea
                ref="floatingChatInput"
                v-model="draft"
                rows="3"
                class="textarea textarea-bordered min-h-24 w-full resize-y"
                :placeholder="t('floatingChat.inputPlaceholder', { assistant: resolvedBrand.assistantName })"
                :aria-label="t('floatingChat.inputAria')"
                :disabled="loading"
                @keydown="handleDraftKeydown"
              />
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs text-base-content/70">
                  {{ t("floatingChat.composerHint") }}
                </p>
                <div class="flex items-center gap-2">
                  <ChatVoiceControls
                    v-model:selected-voice-id="selectedVoiceId"
                    v-model:auto-speak-replies="autoSpeakReplies"
                    compact
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
                    class="btn btn-primary"
                    :aria-label="t('floatingChat.sendAria')"
                    :disabled="!draft.trim() || loading"
                  >
                    <span v-if="loading" class="loading loading-spinner loading-xs" />
                    <svg
                      v-else
                      class="h-4 w-4"
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
                  </button>
                </div>
              </div>
            </form>
            <p
              v-if="voiceSupportHintKey"
              class="mt-2 text-xs text-base-content/70"
              role="status"
              aria-live="polite"
            >
              {{ t(voiceSupportHintKey) }}
            </p>
            <p
              v-if="voiceErrorLabel"
              class="mt-1 text-xs text-error"
              role="status"
              aria-live="assertive"
            >
              {{ voiceErrorLabel }}
            </p>
            <p v-if="isSpeechConfigDirty && isSpeechSettingsOpen" class="mt-2 text-xs text-base-content/60">
              {{ t("aiChatPage.voiceSettings.unsavedHint") }}
            </p>
            <SpeechModelProfileFields
              v-if="isSpeechSettingsOpen"
              class="mt-2"
              :provider-options="speechProviderOptions"
              :stt-provider="speechConfig.sttProvider"
              :stt-model="speechConfig.sttModel"
              :tts-provider="speechConfig.ttsProvider"
              :tts-model="speechConfig.ttsModel"
              :stt-model-options="sttModelOptions"
              :tts-model-options="ttsModelOptions"
              :saving="speechConfigSaving"
              @update:stt-provider="speechConfig.sttProvider = $event"
              @update:stt-model="speechConfig.sttModel = $event"
              @update:tts-provider="speechConfig.ttsProvider = $event"
              @update:tts-model="speechConfig.ttsModel = $event"
              @save="handleSaveSpeechConfig"
            />
          </div>
        </div>
      </div>

      <div class="indicator">
        <span
          v-if="unreadCount > 0 && !isOpen"
          class="indicator-item badge badge-error badge-sm"
          :aria-label="t('floatingChat.unreadAria', { count: unreadCount })"
        >
          {{ unreadCount }}
        </span>
        <button
          type="button"
          class="btn btn-primary btn-circle shadow-lg"
          :aria-label="isOpen ? t('floatingChat.hideAria') : t('floatingChat.showAria')"
          :aria-expanded="isOpen"
          :aria-controls="chatPanelId"
          @click="toggleWidget"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z"
            />
          </svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>
