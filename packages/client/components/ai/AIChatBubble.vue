<script setup lang="ts">
import { DEFAULT_APP_LANGUAGE } from "@bao/shared/constants/settings";
import type { ChatMessage } from "@bao/shared/types/ai";
import { useI18n } from "vue-i18n";
import {
  CHAT_AVATAR_SIZE_CLASS_BY_DENSITY,
  CHAT_BUBBLE_SIZE_CLASS_BY_DENSITY,
  CHAT_MESSAGE_WIDTH_CLASS_BY_DENSITY,
  type ChatDensity,
} from "~/constants/chat";
import {
  BADGE_GHOST_XS_CLASS,
  BADGE_OUTLINE_XS_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  RADIUS_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { formatChatTimestamp } from "~/utils/chat";

const props = withDefaults(
  defineProps<{
    message: ChatMessage;
    locale?: string;
    isStreaming?: boolean;
    userLabel: string;
    assistantLabel: string;
    isLatestAssistantMessage?: boolean;
    contextChips?: string[];
    contextChipsAria?: string;
    density?: ChatDensity;
  }>(),
  {
    locale: DEFAULT_APP_LANGUAGE,
    isStreaming: false,
    isLatestAssistantMessage: false,
    contextChips: () => [],
    contextChipsAria: "",
    density: "comfortable",
  },
);

const { t } = useI18n();
const isAssistant = computed(() => props.message.role === "assistant");
const statusTextId = computed(() => (props.message.id ? `chat-status-${props.message.id}` : ""));
const chatClass = computed(() => (isAssistant.value ? "chat-start" : "chat-end"));
const avatarClass = computed(() => {
  if (!isAssistant.value) {
    return "";
  }
  return props.isLatestAssistantMessage && props.isStreaming ? "avatar-online" : "avatar-offline";
});
const avatarLabel = computed(() => {
  if (!isAssistant.value) {
    return props.userLabel;
  }
  if (props.isStreaming) {
    return t("aiChatCommon.voice.speakingStatus");
  }
  return props.assistantLabel;
});
const chatBubbleClass = computed(() =>
  isAssistant.value
    ? `border border-base-300 ${SURFACE_GLASS_SUBTLE_CLASS} text-base-content ${SHADOW_TOKEN_CLASS.sm}`
    : `chat-bubble-primary ${SHADOW_TOKEN_CLASS.sm}`,
);
const messageWidthClass = computed(() => CHAT_MESSAGE_WIDTH_CLASS_BY_DENSITY[props.density]);
const bubbleSizeClass = computed(() => CHAT_BUBBLE_SIZE_CLASS_BY_DENSITY[props.density]);
const avatarSizeClass = computed(() => CHAT_AVATAR_SIZE_CLASS_BY_DENSITY[props.density]);
const formattedTime = computed(() => formatChatTimestamp(props.message.timestamp, props.locale));
const messageTitle = computed(() => (isAssistant.value ? props.assistantLabel : props.userLabel));
const userAvatarInitial = computed(() => {
  const trimmedLabel = props.userLabel.trim();
  if (trimmedLabel.length === 0) {
    return "?";
  }

  return trimmedLabel.charAt(0).toUpperCase();
});
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
    class="chat" :class="[FLUID_WIDTH_CLASS, chatClass]"
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
      <div 
        class="flex items-center justify-center border border-base-300 bg-base-200 text-base-content" :class="[RADIUS_TOKEN_CLASS.full, avatarSizeClass]"
      >
        <IconLightbulb :class="ICON_SIZE_CLASS.md" />
      </div>
    </div>
    <div 
      v-else
      class="chat-image avatar placeholder"
      :aria-label="userLabel"
    >
      <div 
        class="flex items-center justify-center bg-primary text-primary-content" :class="[RADIUS_TOKEN_CLASS.full, avatarSizeClass]"
      >
        <span class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ userAvatarInitial }}</span>
      </div>
    </div>
    <div class="chat-header" :class="[MARGIN_TOKEN_CLASS.mb1, messageWidthClass]">
      {{ messageTitle }}
      <time 
        v-if="formattedTime"
        class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs, MARGIN_TOKEN_CLASS.ml1]"
        :datetime="props.message.timestamp ?? undefined"
      >
        {{ formattedTime }}
      </time>
    </div>
    <div 
      class="chat-bubble whitespace-pre-wrap break-words"
      :class="[chatBubbleClass, bubbleSizeClass, messageWidthClass]"
    >
      <ul
        v-if="props.contextChips.length > 0"
        class="flex flex-wrap" :class="[MARGIN_TOKEN_CLASS.mb2, FLEX_GAP_TOKEN_CLASS.gap1]"
        :aria-label="props.contextChipsAria || undefined"
      >
        <li v-for="chip in props.contextChips" :key="chip">
          <span :class="BADGE_OUTLINE_XS_CLASS">{{ chip }}</span>
        </li>
      </ul>
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
      class="chat-footer text-muted"
      role="status"
      aria-live="polite"
    >
      {{ statusText }}
    </div>
    <div 
      v-if="isAssistant && (props.message.provider || props.message.model)"
      class="chat-footer flex flex-wrap" :class="[MARGIN_TOKEN_CLASS.mt1, FLEX_GAP_TOKEN_CLASS.gap1]"
    >
      <span v-if="props.message.provider" :class="BADGE_GHOST_XS_CLASS">{{ props.message.provider }}</span>
      <span v-if="props.message.model" :class="[BADGE_GHOST_XS_CLASS, 'text-muted']">{{ props.message.model }}</span>
      <span v-if="props.message.confidence !== undefined" :class="BADGE_OUTLINE_XS_CLASS">
        {{ props.message.confidence }}%
      </span>
    </div>
  </article>
</template>
