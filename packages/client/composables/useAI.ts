import type { ChatMessage } from "@navi/shared";
import { STATE_KEYS } from "@navi/shared";

type AIChatResponse = {
  message?: string;
  sessionId?: string;
  timestamp?: string;
};

/**
 * AI interaction composable for chat, analysis, and generation.
 */
export function useAI() {
  const api = useApi();
  const messages = useState<ChatMessage[]>(STATE_KEYS.AI_MESSAGES, () => []);
  const streaming = useState(STATE_KEYS.AI_STREAMING, () => false);
  const loading = useState(STATE_KEYS.AI_LOADING, () => false);

  async function sendMessage(content: string) {
    loading.value = true;
    streaming.value = true;
    try {
      const userMessage: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      messages.value.push(userMessage);

      const { data, error } = await api.ai.chat.post({ message: content });
      if (error) throw new Error("Failed to send message");

      const response = (data ?? {}) as AIChatResponse;
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.message || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toISOString(),
      };
      messages.value.push(assistantMessage);
      return data;
    } finally {
      loading.value = false;
      streaming.value = false;
    }
  }

  async function analyzeResume(resumeId: string) {
    loading.value = true;
    try {
      const { data, error } = await api.ai["analyze-resume"].post({ resumeId });
      if (error) throw new Error("Failed to analyze resume");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function generateCoverLetter(generationData: Record<string, unknown>) {
    loading.value = true;
    try {
      const { data, error } = await api.ai["generate-cover-letter"].post(generationData);
      if (error) throw new Error("Failed to generate cover letter");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function matchJobs(resumeId: string) {
    loading.value = true;
    try {
      const { data, error } = await api.ai["match-jobs"].post({ resumeId });
      if (error) throw new Error("Failed to match jobs");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function getModels() {
    loading.value = true;
    try {
      const { data, error } = await api.ai.models.get();
      if (error) throw new Error("Failed to fetch AI models");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function getUsage() {
    loading.value = true;
    try {
      const { data, error } = await api.ai.usage.get();
      if (error) throw new Error("Failed to fetch AI usage");
      return data;
    } finally {
      loading.value = false;
    }
  }

  function clearMessages() {
    messages.value = [];
  }

  return {
    messages: readonly(messages),
    streaming: readonly(streaming),
    loading: readonly(loading),
    sendMessage,
    analyzeResume,
    generateCoverLetter,
    matchJobs,
    getModels,
    getUsage,
    clearMessages,
  };
}
