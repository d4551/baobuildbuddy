<script setup lang="ts">
import type { ChatMessage } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { nextTick } from "vue";
import { buildChatMessageRenderRows, resolveLatestAssistantMessageIndex } from "~/utils/chat";

interface Question {
  id: string;
  text: string;
}

interface Response {
  questionId: string;
  text: string;
}

const props = defineProps<{
  questions: Question[];
  responses: Response[];
  currentIndex: number;
}>();

const emit = defineEmits<{
  respond: [response: string];
}>();
const { t, locale } = useI18n();

const currentResponse = ref("");
const responseTextareaId = "interview-chat-response";
const responseHintId = "interview-chat-submit-hint";
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
  return currentResponse.value.trim().length > 0;
});

function submitResponse() {
  if (!canSubmit.value) return;

  emit("respond", currentResponse.value);
  currentResponse.value = "";
}

watch(renderedMessages, async () => {
  await nextTick();
  if (!chatHistoryRef.value) return;

  chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
});
</script>

<template>
  <div class="flex flex-col h-full gap-3">
    <!-- Chat History -->
    <div
      ref="chatHistoryRef"
      class="flex-1 overflow-y-auto space-y-4 p-4 bg-base-200 rounded-t-lg"
      role="log"
      :aria-label="t('interviewChatComponent.responseAria')"
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

    <!-- Response Input -->
    <div v-if="currentQuestion" class="p-4 bg-base-100 rounded-b-lg border-t border-base-300">
      <form class="form-control gap-2" @submit.prevent="submitResponse">
        <div class="label">
          <label :for="responseTextareaId" class="label-text font-medium">
            {{ t("interviewChatComponent.responseLabel") }}
          </label>
          <span class="label-text font-medium">
            {{ t("interviewChatComponent.questionProgress", { current: currentIndex + 1, total: questions.length }) }}
          </span>
        </div>
        <textarea
          :id="responseTextareaId"
          v-model="currentResponse"
          class="textarea textarea-bordered h-24"
          :placeholder="t('interviewChatComponent.responsePlaceholder')"
          :aria-label="t('interviewChatComponent.responseAria')"
          :aria-describedby="responseHintId"
          @keyup.ctrl.enter.prevent="submitResponse"
          @keyup.meta.enter.prevent="submitResponse"
        ></textarea>
        <span :id="responseHintId" class="label-text-alt">{{ t("interviewChatComponent.submitHint") }}</span>
        <button
          type="submit"
          class="btn btn-primary btn-sm self-end"
          :aria-label="t('interviewChatComponent.submitAria')"
          :disabled="!canSubmit"
        >
          {{ t("interviewChatComponent.submitButton") }}
        </button>
      </form>
    </div>

    <div v-else class="p-4 text-center text-base-content/70">
      <p>{{ t("interviewChatComponent.completeMessage") }}</p>
    </div>
  </div>
</template>
