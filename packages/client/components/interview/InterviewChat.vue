<script setup lang="ts">
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

const currentResponse = ref("");

const chatMessages = computed(() => {
  const messages: Array<{ role: "interviewer" | "user"; text: string; questionId: string }> = [];

  props.questions.forEach((question) => {
    messages.push({
      role: "interviewer",
      text: question.text,
      questionId: question.id,
    });

    const response = props.responses.find((r) => r.questionId === question.id);
    if (response) {
      messages.push({
        role: "user",
        text: response.text,
        questionId: question.id,
      });
    }
  });

  return messages;
});

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
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Chat History -->
    <div class="flex-1 overflow-y-auto space-y-4 p-4 bg-base-200 rounded-t-lg">
      <div
        v-for="(message, index) in chatMessages"
        :key="index"
        class="chat"
        :class="message.role === 'interviewer' ? 'chat-start' : 'chat-end'"
      >
        <div class="chat-image avatar placeholder">
          <div
            class="w-10 rounded-full"
            :class="message.role === 'interviewer' ? 'bg-primary text-primary-content' : 'bg-neutral text-neutral-content'"
          >
            <span v-if="message.role === 'interviewer'">AI</span>
            <span v-else>U</span>
          </div>
        </div>
        <div class="chat-header mb-1">
          {{ message.role === 'interviewer' ? 'Interviewer' : 'You' }}
        </div>
        <div
          class="chat-bubble"
          :class="[
            message.role === 'interviewer' ? 'chat-bubble-primary' : '',
            message.questionId === currentQuestion?.id && message.role === 'interviewer' ? 'ring-2 ring-accent' : ''
          ]"
        >
          {{ message.text }}
        </div>
      </div>
    </div>

    <!-- Response Input -->
    <div v-if="currentQuestion" class="p-4 bg-base-100 rounded-b-lg border-t border-base-300">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Your Response</span>
          <span class="label-text-alt">Question {{ currentIndex + 1 }} of {{ questions.length }}</span>
        </label>
        <textarea
          v-model="currentResponse"
          class="textarea textarea-bordered h-24"
          placeholder="Type your answer here..."
          @keyup.ctrl.enter="submitResponse"
        ></textarea>
        <label class="label">
          <span class="label-text-alt">Press Ctrl+Enter to submit</span>
          <button
            class="btn btn-primary btn-sm"
            :disabled="!canSubmit"
            @click="submitResponse"
          >
            Submit Response
          </button>
        </label>
      </div>
    </div>

    <div v-else class="p-4 text-center text-base-content/70">
      <p>Interview complete. All questions have been answered.</p>
    </div>
  </div>
</template>
