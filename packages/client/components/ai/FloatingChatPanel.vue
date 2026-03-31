<script setup lang="ts">
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { FLOATING_CHAT_PANEL_SIZE_CLASS } from "~/constants/chat";

defineProps<{
  aiChatPagePath: string;
  autoSpeakReplies: boolean;
  availableVoices: ReadonlyArray<SpeechSynthesisVoice>;
  canReplayAssistant: boolean;
  chatPanelId: string;
  contextChips: readonly string[];
  contextualPrompts: readonly string[];
  currentContextLabel: string;
  focusedEntityLabel: string;
  hasConversation: boolean;
  isOpen: boolean;
  isSpeechConfigDirty: boolean;
  isSpeechSettingsOpen: boolean;
  isVoiceListening: boolean;
  isVoiceSpeaking: boolean;
  latestAssistantMessageIndex: number;
  loading: boolean;
  locale: string;
  renderedMessages: ReadonlyArray<{ key: string; message: { role: string; content: string } }>;
  resolvedBrand: { assistantName: string };
  selectedVoiceId: string;
  showWidget: boolean;
  speechConfig: { sttProvider: string; sttModel: string; ttsProvider: string; ttsModel: string };
  speechConfigSaving: boolean;
  speechProviderOptions: ReadonlyArray<{ label: string; value: string }>;
  sttModelOptions: ReadonlyArray<string>;
  streaming: boolean;
  streamingBubble: { role: string; content: string };
  supportsRecognition: boolean;
  supportsSynthesis: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
  ttsModelOptions: ReadonlyArray<string>;
  voiceErrorLabel: string;
  voiceSupportHintKey: string;
}>();

const emit = defineEmits<{
  clear: [];
  close: [];
  prompt: [prompt: string];
  scroll: [];
  send: [];
  toggleListening: [];
  toggleSpeechSettings: [];
  replayAssistant: [];
  saveSpeechConfig: [];
  "update:selectedVoiceId": [value: string];
  "update:autoSpeakReplies": [value: boolean];
  "update:sttProvider": [value: string];
  "update:sttModel": [value: string];
  "update:ttsProvider": [value: string];
  "update:ttsModel": [value: string];
  draftKeydown: [event: KeyboardEvent];
}>();

const draft = defineModel<string>("draft", { required: true });
</script>

<template>
  <div
    v-if="isOpen"
    :id="chatPanelId"
    class="card h-full border border-base-300 bg-base-100 shadow-xl"
    :class="FLOATING_CHAT_PANEL_SIZE_CLASS"
  >
    <div class="card-body h-full p-0">
      <header class="flex items-center justify-between border-b border-base-300 p-3">
        <div>
          <h2 class="text-sm font-semibold">{{ resolvedBrand.assistantName }}</h2>
          <div class="mt-1 flex items-center gap-2">
            <p class="text-xs text-base-content/60">{{ t("floatingChat.subtitle") }}</p>
            <span class="badge badge-soft badge-info badge-xs" :aria-label="t('floatingChat.contextAria', { context: currentContextLabel })">
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
          <ul v-if="contextChips.length > 0" class="mt-2 flex flex-wrap gap-2" :aria-label="t('floatingChat.contextChipsAria')">
            <li v-for="chip in contextChips" :key="chip">
              <span class="badge badge-ghost badge-xs">{{ chip }}</span>
            </li>
          </ul>
        </div>
        <div class="flex items-center gap-1">
          <NuxtLink :to="aiChatPagePath" class="btn btn-ghost btn-xs" :aria-label="t('floatingChat.expandAria')">
            {{ t("floatingChat.expandButton") }}
          </NuxtLink>
          <button type="button" class="btn btn-ghost btn-xs" :aria-label="t('floatingChat.voiceSettings.toggleAria')" :aria-expanded="isSpeechSettingsOpen" @click="emit('toggleSpeechSettings')">
            {{ t("floatingChat.voiceSettings.toggleButton") }}
          </button>
          <button type="button" class="btn btn-ghost btn-xs" :aria-label="t('floatingChat.clearAria')" @click="emit('clear')">
            {{ t("floatingChat.clearButton") }}
          </button>
          <button type="button" class="btn btn-ghost btn-xs" :aria-label="t('floatingChat.closeAria')" @click="emit('close')">
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
              @click="emit('prompt', prompt)"
            >
              {{ prompt }}
            </button>
          </li>
        </ul>
      </div>

      <div
        class="flex-1 space-y-3 overflow-y-auto p-3"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        :aria-label="t('floatingChat.logAria')"
        :aria-busy="loading || streaming"
        @scroll="emit('scroll')"
      >
        <div v-if="!hasConversation" class="flex h-full min-h-60 items-center justify-center">
          <div class="card w-full border border-base-300 bg-base-200/60 shadow-sm">
            <div class="card-body gap-3 p-4">
              <h3 class="card-title text-base">{{ t("floatingChat.emptyTitle") }}</h3>
              <p class="text-sm leading-6 text-base-content/70">{{ t("floatingChat.emptyDescription") }}</p>
            </div>
          </div>
        </div>
        <template v-else>
          <AIChatBubble
            v-for="(messageRow, index) in renderedMessages"
            :key="messageRow.key"
            :assistant-label="resolvedBrand.assistantName"
            :context-chips="index === latestAssistantMessageIndex && messageRow.message.role === 'assistant' ? contextChips : []"
            :context-chips-aria="t('floatingChat.contextChipsAria')"
            :is-latest-assistant-message="index === latestAssistantMessageIndex && messageRow.message.role === 'assistant'"
            :is-streaming="false"
            :locale="locale"
            :message="messageRow.message"
            density="compact"
            :user-label="t('floatingChat.youLabel')"
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
            density="compact"
            :user-label="t('floatingChat.youLabel')"
          />
        </template>
      </div>

      <div class="border-t border-base-300 p-3">
        <form class="space-y-3" @submit.prevent="emit('send')">
          <textarea
            v-model="draft"
            rows="3"
            class="textarea min-h-24 w-full resize-y"
            :placeholder="t('floatingChat.inputPlaceholder', { assistant: resolvedBrand.assistantName })"
            :aria-label="t('floatingChat.inputAria')"
            :disabled="loading"
            @keydown="emit('draftKeydown', $event)"
          />
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-base-content/70">{{ t("floatingChat.composerHint") }}</p>
            <div class="flex items-center gap-2">
              <ChatVoiceControls
                :selected-voice-id="selectedVoiceId"
                :auto-speak-replies="autoSpeakReplies"
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
                @update:selected-voice-id="emit('update:selectedVoiceId', $event)"
                @update:auto-speak-replies="emit('update:autoSpeakReplies', $event)"
                @toggle-listening="emit('toggleListening')"
                @replay-assistant="emit('replayAssistant')"
              />
              <button type="submit" class="btn btn-primary" :aria-label="t('floatingChat.sendAria')" :disabled="!draft.trim() || loading">
                <span v-if="loading" class="loading loading-spinner loading-xs" />
                <IconSend v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
        <p v-if="voiceSupportHintKey" class="mt-2 text-xs text-base-content/70" role="status" aria-live="polite">
          {{ t(voiceSupportHintKey) }}
        </p>
        <p v-if="voiceErrorLabel" class="mt-1 text-xs text-error" role="status" aria-live="assertive">
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
          @update:stt-provider="emit('update:sttProvider', $event)"
          @update:stt-model="emit('update:sttModel', $event)"
          @update:tts-provider="emit('update:ttsProvider', $event)"
          @update:tts-model="emit('update:ttsModel', $event)"
          @save="emit('saveSpeechConfig')"
        />
      </div>
    </div>
  </div>
</template>
