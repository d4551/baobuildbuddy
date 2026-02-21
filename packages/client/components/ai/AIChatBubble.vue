<script setup lang="ts">
import type { ChatMessage } from "@bao/shared";
import { DEFAULT_APP_LANGUAGE } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { formatChatTimestamp } from "~/utils/chat";

const props = withDefaults(
  defineProps<{
    message: ChatMessage;
    locale?: string;
    isStreaming?: boolean;
    userLabel: string;
    assistantLabel: string;
    isLatestAssistantMessage?: boolean;
  }>(),
  {
    locale: DEFAULT_APP_LANGUAGE,
    isStreaming: false,
    isLatestAssistantMessage: false,
  },
);

const { t } = useI18n();
const CHAT_MESSAGE_WIDTH_CLASS = "w-fit min-w-36 max-w-md lg:max-w-2xl";
const CHAT_BUBBLE_SIZE_CLASS = "min-h-12 px-4 py-3 text-sm leading-relaxed sm:text-base";
const isAssistant = computed(() => props.message.role === "assistant");
const statusTextId = computed(() => (props.message.id ? `chat-status-${props.message.id}` : ""));
const chatClass = computed(() => (isAssistant.value ? "chat-start" : "chat-end"));
const avatarClass = computed(() => {
  if (!isAssistant.value) {
    return "";
  }
  return props.isLatestAssistantMessage && props.isStreaming ? "avatar-online" : "avatar-offline";
});
const avatarLabel = computed(() =>
  isAssistant.value
    ? props.isStreaming
      ? t("aiChatCommon.voice.speakingStatus")
      : props.assistantLabel
    : props.userLabel,
);
const chatBubbleClass = computed(() =>
  isAssistant.value ? "chat-bubble-secondary" : "chat-bubble-primary",
);
const formattedTime = computed(() => formatChatTimestamp(props.message.timestamp, props.locale));
const messageTitle = computed(() => (isAssistant.value ? props.assistantLabel : props.userLabel));
const isStreamingStatusVisible = computed(
  () => isAssistant.value && props.isLatestAssistantMessage && props.isStreaming,
);
const statusText = computed(() => {
  return isStreamingStatusVisible.value ? t("aiChatCommon.voice.speakingStatus") : "";
});
const ariaLabel = computed(() => {
  if (formattedTime.value.length === 0) {
    return `${messageTitle.value} ${statusText.value}`.trim();
  }
  const timeLabel = t("aiChatCommon.timeAt", { time: formattedTime.value });
  if (statusText.value.length > 0) {
    return `${messageTitle.value}, ${timeLabel}, ${statusText.value}`;
  }
  return `${messageTitle.value}, ${timeLabel}`;
});
</script>

<template>
  <article
    class="chat w-full"
    :class="chatClass"
    role="listitem"
    :aria-label="ariaLabel"
    :aria-busy="isStreaming"
    :aria-live="isStreaming ? 'polite' : 'off'"
    :aria-atomic="true"
    :aria-describedby="statusTextId.length > 0 ? statusTextId : undefined"
  >
    <div
      v-if="isAssistant"
      class="chat-image avatar"
      :class="avatarClass"
      :aria-label="avatarLabel"
    >
      <div class="w-10 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>
    </div>
    <div
      v-else
      class="chat-image avatar placeholder"
      :aria-label="userLabel"
    >
      <div class="w-10 rounded-full bg-primary text-primary-content">
        <span class="text-xl">{{ userLabel }}</span>
      </div>
    </div>
    <div class="chat-header mb-1" :class="CHAT_MESSAGE_WIDTH_CLASS">
      {{ messageTitle }}
      <time
        v-if="formattedTime"
        class="text-xs opacity-50 ml-1"
        :datetime="props.message.timestamp ?? undefined"
      >
        {{ formattedTime }}
      </time>
    </div>
    <div
      class="chat-bubble whitespace-pre-wrap break-words"
      :class="[chatBubbleClass, CHAT_BUBBLE_SIZE_CLASS, CHAT_MESSAGE_WIDTH_CLASS]"
    >
      <span
        v-if="isStreaming && !message.content"
        class="loading loading-dots loading-sm"
        role="status"
        :aria-label="t('aiChatCommon.voice.speakingStatus')"
      >
        <span class="sr-only">{{ t("aiChatCommon.voice.speakingStatus") }}</span>
      </span>
      <template v-else>{{ message.content }}</template>
    </div>
    <div
      v-if="isStreamingStatusVisible"
      :id="statusTextId"
      class="chat-footer opacity-50"
      role="status"
      aria-live="polite"
    >
      {{ statusText }}
    </div>
  </article>
</template>
