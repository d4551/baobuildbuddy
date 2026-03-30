import type {
  ChatMessage,
  GameStudio,
  InterviewSession,
  Job,
  PortfolioData,
  ResumeData,
} from "@bao/shared";
import { generateId, STATE_KEYS } from "@bao/shared";
import type { ComposerTranslation } from "vue-i18n";
import { createChatMessage } from "~/utils/chat";

export interface AIStateRefs {
  messages: ReturnType<typeof useState<ChatMessage[]>>;
  sessionId: ReturnType<typeof useState<string>>;
  streaming: ReturnType<typeof useState<boolean>>;
  loading: ReturnType<typeof useState<boolean>>;
  resumes: ReturnType<typeof useState<ResumeData[]>>;
  jobs: ReturnType<typeof useState<Job[]>>;
  currentStudio: ReturnType<typeof useState<GameStudio | null>>;
  interviewSessions: ReturnType<typeof useState<InterviewSession[]>>;
  portfolioData: ReturnType<typeof useState<PortfolioData | null>>;
  buildAssistantGreetingMessage: () => ChatMessage;
}

export function initializeAIState(
  t: ComposerTranslation,
  brandName: string,
  assistantName: string,
): AIStateRefs {
  const messages = useState<ChatMessage[]>(STATE_KEYS.AI_MESSAGES, () => []);
  const state: AIStateRefs = {
    messages,
    sessionId: useState<string>(STATE_KEYS.AI_SESSION_ID, () => generateId()),
    streaming: useState(STATE_KEYS.AI_STREAMING, () => false),
    loading: useState(STATE_KEYS.AI_LOADING, () => false),
    resumes: useState<ResumeData[]>(STATE_KEYS.RESUME_LIST, () => []),
    jobs: useState<Job[]>(STATE_KEYS.JOBS_LIST, () => []),
    currentStudio: useState<GameStudio | null>(STATE_KEYS.STUDIO_CURRENT, () => null),
    interviewSessions: useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []),
    portfolioData: useState<PortfolioData | null>(STATE_KEYS.PORTFOLIO_DATA, () => null),
    buildAssistantGreetingMessage: () =>
      createChatMessage({
        role: "assistant",
        content: t("aiChatCommon.defaultGreeting", { brand: brandName, assistant: assistantName }),
        timestamp: new Date().toISOString(),
      }),
  };

  if (messages.value.length === 0) {
    messages.value = [state.buildAssistantGreetingMessage()];
  }

  return state;
}
