<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, FLUID_HEIGHT_CLASS, FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import type { ChatMessage } from "@bao/shared/types/ai";
import { useI18n } from "vue-i18n";

defineProps<{
  resolvedBrand: { assistantName: string; name: string };
  locale: string;
  loading: boolean;
  streaming: boolean;
  clearMessages: () => void;
  currentContextLabel: string;
  focusedEntityLabel: string;
  contextChips: string[];
  contextualPrompts: string[];
  hasConversation: boolean;
  renderedMessages: Array<{ key: string; message: ChatMessage }>;
  latestAssistantMessageIndex: number;
  streamingBubble: ChatMessage;
  input: string;
  composerStatusLabel: string;
  autoSpeakReplies: boolean;
  canReplayAssistant: boolean;
  voiceSupportHintKey: string;
  voiceErrorLabel: string;
  isVoiceListening: boolean;
  isVoiceSpeaking: boolean;
  supportsRecognition: boolean;
  supportsSynthesis: boolean;
  selectedVoiceId: string;
  availableVoices: SpeechSynthesisVoice[];
  speechProviderOptions: ReturnType<
    typeof useSpeechModelProfiles
  >["speechProviderOptions"]["value"];
  speechConfig: ReturnType<typeof useSpeechModelProfiles>["speechConfig"]["value"];
  sttModelOptions: ReturnType<typeof useSpeechModelProfiles>["sttModelOptions"]["value"];
  ttsModelOptions: ReturnType<typeof useSpeechModelProfiles>["ttsModelOptions"]["value"];
  speechConfigSaving: boolean;
  isSpeechConfigDirty: boolean;
}>();

const emit = defineEmits<{
  scroll: [];
  clear: [];
  prompt: [prompt: string];
  keydown: [event: KeyboardEvent];
  send: [];
  "update:input": [value: string];
  "update:selectedVoiceId": [value: string];
  "update:autoSpeakReplies": [value: boolean];
  "update:sttProvider": [value: string];
  "update:sttModel": [value: string];
  "update:ttsProvider": [value: string];
  "update:ttsModel": [value: string];
  saveSpeech: [];
  toggleListening: [];
  replayAssistant: [];
}>();

const { t } = useI18n();

const updateInput = (event: Event): void => {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit("update:input", target.value);
};
</script>

<template>
  <section class="card min-h-0 border border-base-300 bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
    <div class="flex min-h-0 flex-1 flex-col">
      <header class="border-b border-base-300 px-5 py-5 sm:px-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
            <div>
              <h1 class="font-bold" :class="[TYPOGRAPHY_SCALE_CLASS.xl3]">
                {{ t("aiChatPage.title", { brand: resolvedBrand.name }) }}
              </h1>
              <p class="text-base text-secondary">{{ t("aiChatPage.subtitle") }}</p>
            </div>
            <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
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
            @click="emit('clear')"
          >
            {{ t("aiChatPage.clearButton") }}
          </button>
        </div>
      </header>

      <div
        ref="aiChatContainer"
        class="min-h-0 flex-1 overflow-y-auto glass-subtle px-4 py-4 sm:px-6"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        :aria-busy="loading || streaming"
        :aria-label="t('aiChatPage.logAria')"
        @scroll="emit('scroll')"
      >
        <div v-if="!hasConversation" class="flex min- items-center justify-center py-8" :class="[FLUID_HEIGHT_CLASS]">
          <div class="card max-w-2xl border border-base-300 bg-base-100" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm]">
            <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
              <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                <span class="badge badge-soft badge-info">
                  {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
                </span>
                <span v-if="focusedEntityLabel" class="badge badge-soft badge-primary">
                  {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
                </span>
              </div>
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
                <h2 class="card-title text-xl">{{ t("aiChatPage.emptyTitle") }}</h2>
                <p class="leading-6 text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ t("aiChatPage.emptyDescription") }}
                </p>
              </div>
              <ul class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]" :aria-label="t('floatingChat.suggestionsAria')">
                <li v-for="prompt in contextualPrompts" :key="prompt">
                  <button
                    type="button"
                    class="btn btn-sm btn-soft"
                    :aria-label="t('floatingChat.suggestionAria', { prompt })"
                    :disabled="loading"
                    @click="emit('prompt', prompt)"
                  >
                    {{ prompt }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div v-else class="py-1" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
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
        <form :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]" @submit.prevent="emit('send')">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
            <label class="sr-only" for="ai-chat-composer">
              {{ t("aiChatPage.inputAria") }}
            </label>
            <textarea
              id="ai-chat-composer"
              ref="aiChatComposer"
              :value="input"
              rows="3"
              class="textarea min-h-28 resize-y" :class="[FLUID_WIDTH_CLASS]"
              :placeholder="t('aiChatPage.inputPlaceholder', { assistant: resolvedBrand.assistantName })"
              :disabled="loading"
              :aria-label="t('aiChatPage.inputAria')"
              @input="updateInput"
              @keydown="emit('keydown', $event)"
            />
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
              <div class="space-y-1">
                <p class="font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
                </p>
                <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  {{ t("aiChatPage.composerHint") }}
                </p>
              </div>
              <div class="flex items-center justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
                <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]" role="status" aria-live="polite">
                  {{ composerStatusLabel }}
                </p>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="!input.trim() || loading"
                  :aria-label="t('aiChatPage.sendAria')"
                >
                  <LoadingSpinner v-if="loading" size="sm" :label="t('aiChatPage.sendAria')" />
                  <IconSend v-else class="h-5 w-5" />
                  <span>{{ t("aiChatPage.sendButton") }}</span>
                </button>
              </div>
            </div>
          </div>

          <ClientOnly>
            <ChatVoiceControls
              :selected-voice-id="selectedVoiceId"
              :auto-speak-replies="autoSpeakReplies"
              :stt-provider="speechConfig.sttProvider"
              :stt-model="speechConfig.sttModel"
              :tts-provider="speechConfig.ttsProvider"
              :tts-model="speechConfig.ttsModel"
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
              @update:selected-voice-id="emit('update:selectedVoiceId', $event)"
              @update:auto-speak-replies="emit('update:autoSpeakReplies', $event)"
              @update:stt-provider="emit('update:sttProvider', $event)"
              @update:stt-model="emit('update:sttModel', $event)"
              @update:tts-provider="emit('update:ttsProvider', $event)"
              @update:tts-model="emit('update:ttsModel', $event)"
              @save-speech-settings="emit('saveSpeech')"
              @toggle-listening="emit('toggleListening')"
              @replay-assistant="emit('replayAssistant')"
            />
          </ClientOnly>

          <p v-if="isSpeechConfigDirty" class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ t("aiChatPage.voiceSettings.unsavedHint") }}
          </p>
        </form>
      </div>
    </div>
  </section>
</template>
