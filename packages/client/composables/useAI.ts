import { useI18n } from "vue-i18n";
import { createChatActions } from "~/composables/ai-chat-actions";
import { createContextBuilder } from "~/composables/ai-context";
import { createDataActions } from "~/composables/ai-data-actions";
import { initializeAIState } from "~/composables/ai-state";

/**
 * AI interaction composable for chat, analysis, and generation.
 */
export function useAI() {
  const api = useApi();
  const route = useRoute();
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const { resolvedBrand } = useBrand();
  const state = initializeAIState(t, resolvedBrand.value.name, resolvedBrand.value.assistantName);

  const buildCurrentContext = createContextBuilder({
    route,
    jobs: state.jobs,
    resumes: state.resumes,
    currentStudio: state.currentStudio,
    interviewSessions: state.interviewSessions,
    portfolioData: state.portfolioData,
  });

  const chatActions = createChatActions({
    api,
    t,
    toast: $toast,
    loading: state.loading,
    streaming: state.streaming,
    messages: state.messages,
    sessionId: state.sessionId,
    buildAssistantGreetingMessage: state.buildAssistantGreetingMessage,
    buildCurrentContext,
    unableToProcessFallback: () => t("aiChatCommon.unableToProcessFallback"),
    requestErrorFallback: () => t("aiChatCommon.requestErrorFallback"),
  });

  const dataActions = createDataActions({ api, t, loading: state.loading });

  return {
    messages: readonly(state.messages),
    sessionId: readonly(state.sessionId),
    streaming: readonly(state.streaming),
    loading: readonly(state.loading),
    buildCurrentContext,
    ...chatActions,
    ...dataActions,
  };
}
