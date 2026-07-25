<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { CHAT_COMPOSER_STICKY_CLASS } from "~/constants/chat";
import {
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { CHAT_PANEL_PADDING_SM_PX6_CLASS } from "~/constants/ui-layout";

defineProps<{
  assistantName: string;
  input: string;
  loading: boolean;
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
  >["speechProviderOptions"];
  ttsProviderOptions: ReturnType<typeof useSpeechModelProfiles>["ttsProviderOptions"];
  speechConfig: ReturnType<typeof useSpeechModelProfiles>["speechConfig"];
  sttModelOptions: ReturnType<typeof useSpeechModelProfiles>["sttModelOptions"]["value"];
  ttsModelOptions: ReturnType<typeof useSpeechModelProfiles>["ttsModelOptions"]["value"];
  speechConfigSaving: boolean;
  isSpeechConfigDirty: boolean;
}>();

const emit = defineEmits<{
  keydown: [event: KeyboardEvent];
  send: [];
  "update:input": [value: string];
  "update:selectedVoiceId": [value: string];
  "update:autoSpeakReplies": [value: boolean];
  "update:sttProvider": [value: string];
  "update:sttModel": [value: string];
  "update:sttEndpoint": [value: string];
  "update:ttsProvider": [value: string];
  "update:ttsModel": [value: string];
  "update:ttsEndpoint": [value: string];
  saveSpeech: [];
  toggleListening: [];
  replayAssistant: [];
  testOnDeviceTts: [];
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
  <div
    :class="[
      CHAT_COMPOSER_STICKY_CLASS,
      PADDING_TOKEN_CLASS.px4,
      PADDING_TOKEN_CLASS.py4,
      CHAT_PANEL_PADDING_SM_PX6_CLASS,
    ]"
  >
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
          class="textarea resize-y"
          :placeholder="t('aiChatPage.inputPlaceholder', { assistant: assistantName })"
          :disabled="loading"
          :aria-label="t('aiChatPage.inputAria')"
          @input="updateInput"
          @keydown="emit('keydown', $event)"
        />
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between"
          :class="[FLEX_GAP_TOKEN_CLASS.gap3]"
        >
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
            <p
              class="break-words text-secondary"
              :class="[TRUNCATE_FLEX_CHILD_CLASS, TYPOGRAPHY_SCALE_CLASS.xs]"
            >
              {{ t("aiChatPage.composerHint") }}
            </p>
          </div>
          <div class="flex items-center justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <p
              class="text-secondary"
              :class="[TYPOGRAPHY_SCALE_CLASS.xs]"
              role="status"
              aria-live="polite"
            >
              {{ composerStatusLabel }}
            </p>
            <button
              type="submit"
              :class="[PRIMARY_ACTION_CLASS]"
              :disabled="!input.trim() || loading"
              :aria-label="t('aiChatPage.sendAria')"
            >
              <LoadingSpinner v-if="loading" size="sm" :label="t('aiChatPage.sendAria')" />
              <IconSend v-else :class="[ICON_SIZE_CLASS['5']]" />
              <span>{{ t("aiChatPage.sendButton") }}</span>
            </button>
          </div>
        </div>
      </div>

      <ClientOnly>
        <!-- Compact: mic/replay only — speech profiles stay out of first viewport (conversation-first). -->
        <ChatVoiceControls
          compact
          :selected-voice-id="selectedVoiceId"
          :auto-speak-replies="autoSpeakReplies"
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
          @test-on-device-tts="emit('testOnDeviceTts')"
        />
      </ClientOnly>
      <details
        class="collapse collapse-arrow border border-base-300 bg-base-100"
        :class="[MARGIN_TOKEN_CLASS.mt2]"
      >
        <summary
          class="collapse-title font-medium"
          :class="[TYPOGRAPHY_SCALE_CLASS.sm, TOUCH_TARGET_MIN_CLASS]"
        >
          {{ t("aiChatPage.voiceSettings.legend") }}
        </summary>
        <div class="collapse-content" :class="[PADDING_TOKEN_CLASS.pb4]">
          <SpeechModelProfileFields
            :provider-options="speechProviderOptions"
            :tts-provider-options="ttsProviderOptions"
            :stt-provider="speechConfig.sttProvider"
            :stt-model="speechConfig.sttModel"
            :stt-endpoint="speechConfig.sttEndpoint"
            :tts-provider="speechConfig.ttsProvider"
            :tts-model="speechConfig.ttsModel"
            :tts-endpoint="speechConfig.ttsEndpoint"
            :stt-model-options="sttModelOptions"
            :tts-model-options="ttsModelOptions"
            :saving="speechConfigSaving"
            @update:stt-provider="emit('update:sttProvider', $event)"
            @update:stt-model="emit('update:sttModel', $event)"
            @update:stt-endpoint="emit('update:sttEndpoint', $event)"
            @update:tts-provider="emit('update:ttsProvider', $event)"
            @update:tts-model="emit('update:ttsModel', $event)"
            @update:tts-endpoint="emit('update:ttsEndpoint', $event)"
            @save="emit('saveSpeech')"
          />
        </div>
      </details>

      <p v-if="isSpeechConfigDirty" class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("aiChatPage.voiceSettings.unsavedHint") }}
      </p>
    </form>
  </div>
</template>
