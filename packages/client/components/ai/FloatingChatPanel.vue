<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import {
  FLOATING_CHAT_PANEL_BODY_CLASS,
  FLOATING_CHAT_PANEL_COMPOSER_CLASS,
  FLOATING_CHAT_PANEL_LOG_CLASS,
  FLOATING_CHAT_PANEL_SIZE_CLASS,
} from "~/constants/chat";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_SQUARE_CLASS,
  ICON_SIZE_CLASS,
  LEADING_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  MIN_H_60_CLASS,
  MIN_HEIGHT_ZERO_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_XS_CLASS,
  BADGE_SOFT_INFO_XS_CLASS,
  BADGE_SOFT_PRIMARY_XS_CLASS,
} from "~/constants/layout-badges";

const draft = defineModel<string>("draft", { required: true });

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
const { t } = useI18n();
</script>

<template>
  <UiGlassCard
    v-if="isOpen"
    :id="chatPanelId"
    :extra-class="`${SHADOW_TOKEN_CLASS.xl} ${FLOATING_CHAT_PANEL_SIZE_CLASS}`"
  >
    <div :class="[FLOATING_CHAT_PANEL_BODY_CLASS]">
      <header
        class="flex shrink-0 items-start justify-between border-b border-base-300"
        :class="[PADDING_TOKEN_CLASS.p3, FLEX_GAP_TOKEN_CLASS.gap2]"
      >
        <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
          <h2 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ resolvedBrand.assistantName }}</h2>
          <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt1]">
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("floatingChat.subtitle") }}</p>
            <span :class="[BADGE_SOFT_INFO_XS_CLASS]" :aria-label="t('floatingChat.contextAria', { context: currentContextLabel })">
              {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
            </span>
            <span
              v-if="focusedEntityLabel"
              :class="[BADGE_SOFT_PRIMARY_XS_CLASS]"
              :aria-label="t('floatingChat.focusedEntityAria', { entity: focusedEntityLabel })"
            >
              {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
            </span>
          </div>
          <ul
            v-if="contextChips.length > 0"
            class="flex flex-wrap"
            :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]"
            :aria-label="t('floatingChat.contextChipsAria')"
          >
            <li v-for="chip in contextChips" :key="chip">
              <span :class="[BADGE_GHOST_XS_CLASS]">{{ chip }}</span>
            </li>
          </ul>
        </div>
        <div class="flex shrink-0 items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap1]">
          <NuxtLink
            :to="aiChatPagePath"
            :class="[GHOST_ACTION_SQUARE_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('floatingChat.expandAria')"
            :title="t('floatingChat.expandButton')"
          >
            <IconExternalLink :class="[ICON_SIZE_CLASS['4']]" aria-hidden="true" />
          </NuxtLink>
          <button
            type="button"
            :class="[GHOST_ACTION_SQUARE_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('floatingChat.voiceSettings.toggleAria')"
            :title="t('floatingChat.voiceSettings.toggleButton')"
            :aria-expanded="isSpeechSettingsOpen"
            @click="emit('toggleSpeechSettings')"
          >
            <IconSparkles :class="[ICON_SIZE_CLASS['4']]" aria-hidden="true" />
          </button>
          <button
            type="button"
            :class="[GHOST_ACTION_SQUARE_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('floatingChat.clearAria')"
            :title="t('floatingChat.clearButton')"
            @click="emit('clear')"
          >
            <IconRefresh :class="[ICON_SIZE_CLASS['4']]" aria-hidden="true" />
          </button>
          <button
            type="button"
            :class="[GHOST_ACTION_SQUARE_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('floatingChat.closeAria')"
            @click="emit('close')"
          >
            <CloseIcon :class="[ICON_SIZE_CLASS['4']]" />
          </button>
        </div>
      </header>

      <div
        class="shrink-0 border-b border-base-300"
        :class="[PADDING_TOKEN_CLASS.px3, PADDING_TOKEN_CLASS.py2]"
      >
        <ChatPromptChips
          :prompts="contextualPrompts"
          :loading="loading"
          @prompt="emit('prompt', $event)"
        />
      </div>

      <div
        :class="[FLOATING_CHAT_PANEL_LOG_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack3, PADDING_TOKEN_CLASS.p3]"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        :aria-label="t('floatingChat.logAria')"
        :aria-busy="loading || streaming"
        @scroll="emit('scroll')"
      >
        <div
          v-if="!hasConversation"
          class="flex items-center justify-center"
          :class="[MIN_HEIGHT_ZERO_CLASS, MIN_H_60_CLASS]"
        >
          <UiGlassCard variant="subtle" :extra-class="FLUID_WIDTH_CLASS">
            <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3, PADDING_TOKEN_CLASS.p4]">
              <h3 class="card-title text-base">{{ t("floatingChat.emptyTitle") }}</h3>
              <p class="text-secondary" :class="[LEADING_TOKEN_CLASS.leading6, TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("floatingChat.emptyDescription") }}
              </p>
            </div>
          </UiGlassCard>
        </div>
        <template v-else>
          <AIChatBubble
            v-for="(messageRow, index) in renderedMessages"
            :key="messageRow.key"
            :assistant-label="resolvedBrand.assistantName"
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
            :is-latest-assistant-message="true"
            :is-streaming="true"
            :locale="locale"
            :message="streamingBubble"
            density="compact"
            :user-label="t('floatingChat.youLabel')"
          />
        </template>
      </div>

      <div :class="[FLOATING_CHAT_PANEL_COMPOSER_CLASS, PADDING_TOKEN_CLASS.p3]">
        <form :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]" @submit.prevent="emit('send')">
          <textarea
            v-model="draft"
            rows="2"
            class="textarea resize-none"
            :placeholder="t('floatingChat.inputPlaceholder', { assistant: resolvedBrand.assistantName })"
            :aria-label="t('floatingChat.inputAria')"
            :disabled="loading"
            @keydown="emit('draftKeydown', $event)"
          />
          <div class="flex items-center justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <ClientOnly>
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
            </ClientOnly>
            <button
              type="submit"
              :class="[PRIMARY_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
              :aria-label="t('floatingChat.sendAria')"
              :disabled="!draft.trim() || loading"
            >
              <LoadingSpinner v-if="loading" size="xs" :label="t('floatingChat.sendAria')" />
              <IconSend v-else :class="[ICON_SIZE_CLASS['4']]" />
            </button>
          </div>
        </form>
        <p v-if="voiceSupportHintKey" class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.xs]" role="status" aria-live="polite">
          {{ t(voiceSupportHintKey) }}
        </p>
        <p v-if="voiceErrorLabel" class="text-error" :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.xs]" role="status" aria-live="assertive">
          {{ voiceErrorLabel }}
        </p>
        <p v-if="isSpeechConfigDirty && isSpeechSettingsOpen" class="text-muted" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.xs]">
          {{ t("aiChatPage.voiceSettings.unsavedHint") }}
        </p>
        <SpeechModelProfileFields
          v-if="isSpeechSettingsOpen"
          :class="[MARGIN_TOKEN_CLASS.mt2]"
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
  </UiGlassCard>
</template>
