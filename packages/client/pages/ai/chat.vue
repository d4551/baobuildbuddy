<script setup lang="ts">
import {
  APP_BRAND,
  APP_SEO,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_SPEECH_SETTINGS,
  SPEECH_MODEL_OPTIONS,
  SPEECH_PROVIDER_OPTIONS,
  type SpeechProviderOption,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
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
const { settings, fetchSettings, updateSettings } = useSettings();
const { $toast } = useNuxtApp();
const { t, locale } = useI18n();

type SpeechConfigKind = "stt" | "tts";

const input = ref("");
const chatContainer = useTemplateRef<HTMLElement>("aiChatContainer");
const speechConfigSaving = ref(false);
const speechConfig = reactive<{
  sttProvider: SpeechProviderOption;
  sttModel: string;
  ttsProvider: SpeechProviderOption;
  ttsModel: string;
}>({
  sttProvider: DEFAULT_SPEECH_SETTINGS.stt.provider,
  sttModel: DEFAULT_SPEECH_SETTINGS.stt.model,
  ttsProvider: DEFAULT_SPEECH_SETTINGS.tts.provider,
  ttsModel: DEFAULT_SPEECH_SETTINGS.tts.model,
});

const resolveProviderModels = (
  kind: SpeechConfigKind,
  provider: SpeechProviderOption,
): readonly string[] => SPEECH_MODEL_OPTIONS[kind][provider];

const resolveDefaultModel = (kind: SpeechConfigKind, provider: SpeechProviderOption): string => {
  const configuredModels = resolveProviderModels(kind, provider);
  if (configuredModels.length === 0) {
    return kind === "stt" ? DEFAULT_SPEECH_SETTINGS.stt.model : DEFAULT_SPEECH_SETTINGS.tts.model;
  }
  return configuredModels[0] ?? "";
};

const sttModelOptions = computed(() => resolveProviderModels("stt", speechConfig.sttProvider));
const ttsModelOptions = computed(() => resolveProviderModels("tts", speechConfig.ttsProvider));
const persistedSpeechConfig = computed(() => {
  const persistedSpeech =
    settings.value?.automationSettings?.speech ?? DEFAULT_AUTOMATION_SETTINGS.speech;
  return {
    sttProvider: persistedSpeech.stt.provider,
    sttModel: persistedSpeech.stt.model,
    ttsProvider: persistedSpeech.tts.provider,
    ttsModel: persistedSpeech.tts.model,
  };
});
const isSpeechConfigDirty = computed(
  () =>
    speechConfig.sttProvider !== persistedSpeechConfig.value.sttProvider ||
    speechConfig.sttModel.trim() !== persistedSpeechConfig.value.sttModel ||
    speechConfig.ttsProvider !== persistedSpeechConfig.value.ttsProvider ||
    speechConfig.ttsModel.trim() !== persistedSpeechConfig.value.ttsModel,
);

watch(
  settings,
  (currentSettings) => {
    const persistedSpeech =
      currentSettings?.automationSettings?.speech ?? DEFAULT_AUTOMATION_SETTINGS.speech;
    speechConfig.sttProvider = persistedSpeech.stt.provider;
    speechConfig.sttModel = persistedSpeech.stt.model;
    speechConfig.ttsProvider = persistedSpeech.tts.provider;
    speechConfig.ttsModel = persistedSpeech.tts.model;
  },
  { immediate: true },
);

watch(
  () => speechConfig.sttProvider,
  (provider) => {
    const options = resolveProviderModels("stt", provider);
    if (options.includes(speechConfig.sttModel)) {
      return;
    }
    speechConfig.sttModel = resolveDefaultModel("stt", provider);
  },
);

watch(
  () => speechConfig.ttsProvider,
  (provider) => {
    const options = resolveProviderModels("tts", provider);
    if (options.includes(speechConfig.ttsModel)) {
      return;
    }
    speechConfig.ttsModel = resolveDefaultModel("tts", provider);
  },
);

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

async function saveSpeechConfig(): Promise<void> {
  if (!isSpeechConfigDirty.value || speechConfigSaving.value) {
    return;
  }

  const existingAutomationSettings =
    settings.value?.automationSettings ?? DEFAULT_AUTOMATION_SETTINGS;
  const sttModel = speechConfig.sttModel.trim();
  const ttsModel = speechConfig.ttsModel.trim();
  const nextSpeechConfig = {
    ...existingAutomationSettings.speech,
    locale: existingAutomationSettings.speech.locale || locale.value,
    stt: {
      ...existingAutomationSettings.speech.stt,
      provider: speechConfig.sttProvider,
      model:
        sttModel.length > 0 ? sttModel : resolveDefaultModel("stt", speechConfig.sttProvider),
    },
    tts: {
      ...existingAutomationSettings.speech.tts,
      provider: speechConfig.ttsProvider,
      model:
        ttsModel.length > 0 ? ttsModel : resolveDefaultModel("tts", speechConfig.ttsProvider),
    },
  };

  speechConfigSaving.value = true;
  const saveSpeechResult = await settlePromise(
    updateSettings({
      automationSettings: {
        ...existingAutomationSettings,
        speech: nextSpeechConfig,
      },
    }),
    t("aiChatPage.voiceSettings.saveErrorFallback"),
  );
  speechConfigSaving.value = false;

  if (!saveSpeechResult.ok) {
    $toast.error(
      getErrorMessage(saveSpeechResult.error, t("aiChatPage.voiceSettings.saveErrorFallback")),
    );
    return;
  }

  $toast.success(t("aiChatPage.voiceSettings.saveSuccess"));
}

onMounted(() => {
  if (!settings.value) {
    void fetchSettings();
  }
});
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
            class="input input-bordered input-lg join-item flex-1"
            :disabled="loading"
            :aria-label="t('aiChatPage.inputAria')"
          />
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
            :speech-provider-options="SPEECH_PROVIDER_OPTIONS"
            :stt-model-options="sttModelOptions"
            :tts-model-options="ttsModelOptions"
            :speech-config-saving="speechConfigSaving"
            :support-hint-key="voiceSupportHintKey"
            :error-label="voiceErrorLabel"
            @save-speech-settings="saveSpeechConfig"
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
        <p v-if="isSpeechConfigDirty" class="text-xs text-base-content/60">
          {{ t("aiChatPage.voiceSettings.unsavedHint") }}
        </p>
      </form>
    </div>
  </div>
</template>
