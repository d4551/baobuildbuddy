<script setup lang="ts">
import type { ChatMessage } from "@bao/shared/types/ai";
import { useI18n } from "vue-i18n";
import { createAiChatConversationEmptyState } from "~/composables/ai-chat-conversation-empty";
import { useSettings } from "~/composables/useSettings";
import {
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  MAX_W_2XL_CLASS,
  MIN_HEIGHT_ZERO_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
} from "~/constants/layout";
import { CHAT_PANEL_PADDING_SM_PX6_CLASS } from "~/constants/ui-layout";

defineProps<{
  assistantName: string;
  locale: string;
  loading: boolean;
  streaming: boolean;
  contextualPrompts: string[];
  hasConversation: boolean;
  renderedMessages: Array<{ key: string; message: ChatMessage }>;
  latestAssistantMessageIndex: number;
  streamingBubble: ChatMessage;
}>();

const emit = defineEmits<{
  scroll: [];
  prompt: [prompt: string];
}>();

const { t } = useI18n();
const { isAiConfigurationIncomplete } = useSettings();
const {
  emptyCtaTo,
  emptyTitleKey,
  emptyDescriptionKey,
  emptyCtaLabelKey,
  emptyCtaAriaKey,
} = createAiChatConversationEmptyState(isAiConfigurationIncomplete);
</script>

<template>
  <div
    ref="aiChatContainer"
    class="flex-1 overflow-y-auto"
    :class="[
      SURFACE_GLASS_SUBTLE_CLASS,
      MIN_HEIGHT_ZERO_CLASS,
      PADDING_TOKEN_CLASS.px4,
      PADDING_TOKEN_CLASS.py4,
      CHAT_PANEL_PADDING_SM_PX6_CLASS,
    ]"
    role="log"
    aria-live="polite"
    aria-atomic="false"
    :aria-busy="loading || streaming"
    :aria-label="t('aiChatPage.logAria')"
    @scroll="emit('scroll')"
  >
    <div
      v-if="!hasConversation"
      class="flex items-center justify-center"
      :class="[MIN_HEIGHT_ZERO_CLASS, PADDING_TOKEN_CLASS.py8, FLUID_HEIGHT_CLASS]"
    >
      <div :class="[MAX_W_2XL_CLASS, FLUID_WIDTH_CLASS]">
        <EmptyState
          :title-key="emptyTitleKey"
          :description-key="emptyDescriptionKey"
          :cta-label-key="emptyCtaLabelKey"
          :cta-aria-key="emptyCtaAriaKey"
          :cta-to="emptyCtaTo"
        >
          <template #actions>
            <ChatPromptChips
              :prompts="contextualPrompts"
              :loading="loading"
              @prompt="emit('prompt', $event)"
            />
          </template>
        </EmptyState>
      </div>
    </div>

    <div v-else :class="[PADDING_TOKEN_CLASS.py1, STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <AIChatBubble
        v-for="(messageRow, index) in renderedMessages"
        :key="messageRow.key"
        :assistant-label="assistantName"
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
        :assistant-label="assistantName"
        :is-latest-assistant-message="true"
        :is-streaming="true"
        :locale="locale"
        :message="streamingBubble"
        :user-label="t('aiChatPage.youLabel')"
      />
    </div>
  </div>
</template>
