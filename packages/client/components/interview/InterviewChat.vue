<script setup lang="ts">
import type { ChatMessage } from "@bao/shared/types/ai";
import { computed, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  MIN_HEIGHT_SCROLL_CLASS,
  MIN_H_80_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { buildChatMessageRenderRows, resolveLatestAssistantMessageIndex } from "~/utils/chat";

interface Question {
  id: string;
  text: string;
}

interface Response {
  questionId: string;
  text: string;
}

const props = withDefaults(
  defineProps<{
    questions: Question[];
    responses: Response[];
    currentIndex: number;
    minResponseLength?: number;
    disabled?: boolean;
    responseLabelKey?: string;
    responsePlaceholderKey?: string;
    responseHintKey?: string;
    responseHintText?: string;
    submitButtonLabelKey?: string;
    submitButtonAriaLabelKey?: string;
    completeMessageKey?: string;
    progressLabelKey?: string;
    responseAriaKey?: string;
    isSubmitting?: boolean;
  }>(),
  {
    minResponseLength: 1,
    disabled: false,
    responseLabelKey: "interviewChatComponent.responseLabel",
    responsePlaceholderKey: "interviewChatComponent.responsePlaceholder",
    responseHintKey: "interviewChatComponent.submitHint",
    responseHintText: "",
    isSubmitting: false,
    submitButtonLabelKey: "interviewChatComponent.submitButton",
    submitButtonAriaLabelKey: "interviewChatComponent.submitAria",
    completeMessageKey: "interviewChatComponent.completeMessage",
    progressLabelKey: "interviewChatComponent.questionProgress",
    responseAriaKey: "interviewChatComponent.responseAria",
  },
);

const emit = defineEmits<{
  respond: [response: string];
  "update:response": [response: string];
}>();
const { t, locale } = useI18n();
const responseIdSeed = Math.random().toString(36).slice(2, 10);
const currentResponse = defineModel<string>("response", { default: "" });
const responseTextareaId = `interview-chat-response-${responseIdSeed}`;
const responseHintId = `interview-chat-submit-hint-${responseIdSeed}`;
const completeMessage = computed(() => t(props.completeMessageKey));
const responseHintText = computed(() =>
  props.responseHintText.length > 0 ? props.responseHintText : t(props.responseHintKey),
);

const currentLocale = computed(() => locale.value);
const chatHistoryRef = ref<HTMLElement | null>(null);

const responseByQuestionId = computed(() => {
  const map = new Map<string, string>();
  for (const response of props.responses) {
    map.set(response.questionId, response.text);
  }
  return map;
});

const chatMessages = computed<ChatMessage[]>(() => {
  const messages: ChatMessage[] = [];

  props.questions.forEach((question) => {
    messages.push({
      id: `interview-question-${question.id}`,
      role: "assistant",
      content: question.text,
    });

    const response = responseByQuestionId.value.get(question.id);
    if (response) {
      messages.push({
        id: `interview-response-${question.id}`,
        role: "user",
        content: response,
      });
    }
  });

  return messages;
});

const renderedMessages = computed(() => buildChatMessageRenderRows(chatMessages.value));
const latestAssistantMessageIndex = computed(() =>
  resolveLatestAssistantMessageIndex(chatMessages.value),
);
const currentQuestion = computed(() => {
  return props.questions[props.currentIndex];
});

const canSubmit = computed(() => {
  return (
    currentResponse.value.trim().length >= props.minResponseLength &&
    !props.disabled &&
    !props.isSubmitting &&
    Boolean(currentQuestion.value)
  );
});

function submitResponse() {
  if (!canSubmit.value) return;

  emit("respond", currentResponse.value.trim());
  currentResponse.value = "";
}

const currentQuestionProgressLabel = computed(() =>
  t(props.progressLabelKey, {
    current: Math.min(props.currentIndex + 1, props.questions.length),
    total: props.questions.length,
  }),
);

watch(
  () => props.disabled,
  (isDisabled) => {
    if (isDisabled) {
      currentResponse.value = "";
    }
  },
);

watch(
  () => currentResponse.value,
  (nextResponse) => {
    emit("update:response", nextResponse);
  },
);

watch(renderedMessages, async () => {
  await nextTick();
  if (!chatHistoryRef.value) return;

  chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
});
</script>

<template>
  <section :class="[SURFACE_GLASS_CARD_CLASS, FLUID_HEIGHT_CLASS]" aria-labelledby="interview-chat-workspace-title">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap0, PADDING_TOKEN_CLASS.p0]">
      <div class="border-b border-base-300" :class="[PADDING_TOKEN_CLASS.px6, PADDING_TOKEN_CLASS.py5]">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
          <h2 id="interview-chat-workspace-title" class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
            {{ t("interviewSession.responseWorkspaceTitle") }}
          </h2>
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("interviewSession.responseWorkspaceDescription") }}
          </p>
        </div>
      </div>

      <div
        ref="chatHistoryRef"
 class="flex-1 overflow-y-auto glass-subtle" 
        role="log"
        :aria-label="t(props.responseAriaKey)"
        aria-live="polite"
      >
        <AIChatBubble
          v-for="(messageRow, index) in renderedMessages"
          :key="messageRow.key"
          :assistant-label="t('interviewChatComponent.interviewerLabel')"
          :is-latest-assistant-message="index === latestAssistantMessageIndex && messageRow.message.role === 'assistant'"
          :is-streaming="false"
          :locale="currentLocale"
          :message="messageRow.message"
          :user-label="t('interviewChatComponent.userLabel')"
        />
      </div>

      <div v-if="currentQuestion" class="border-t border-base-300" :class="[PADDING_TOKEN_CLASS.px6, PADDING_TOKEN_CLASS.py5]">
        <form :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]" @submit.prevent="submitResponse">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t(props.responseLabelKey) }}
            </legend>
            <textarea
              :id="responseTextareaId"
              v-model="currentResponse"
 class="textarea" 
              :placeholder="t(props.responsePlaceholderKey)"
              :aria-label="t(props.responseAriaKey)"
              :aria-describedby="responseHintId"
              :minlength="props.minResponseLength"
              :disabled="props.disabled"
              :aria-disabled="props.disabled ? 'true' : 'false'"
              :aria-invalid="props.disabled || canSubmit ? undefined : 'true'"
              @keyup.ctrl.enter.prevent="submitResponse"
              @keyup.meta.enter.prevent="submitResponse"
            ></textarea>
            <p :id="responseHintId" class="validator-hint text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ responseHintText }}
            </p>
          </fieldset>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ currentQuestionProgressLabel }}
            </p>
            <button
              type="submit"
              class="btn btn-primary"
              :aria-label="t(props.submitButtonAriaLabelKey)"
              :disabled="!canSubmit"
            >
              <LoadingSpinner size="sm" label="Loading" v-if="props.isSubmitting" />
              {{ t(props.submitButtonLabelKey) }}
            </button>
          </div>
        </form>
      </div>

      <div v-else :class="[PADDING_TOKEN_CLASS.px6, PADDING_TOKEN_CLASS.py8]">
        <div class="alert alert-success">
          <span>{{ completeMessage }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
