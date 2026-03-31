import type { InterviewSession } from "@bao/shared/types/interview";
import type { Ref } from "vue";
import type { useI18n } from "vue-i18n";

export type InterviewHistoryView = "table" | "timeline";

export interface InterviewHistoryPageState {
  selectedSessionId: Ref<string | null>;
  selectedSession: Ref<InterviewSession | null>;
  studioFilter: Ref<string>;
  historyView: Ref<InterviewHistoryView>;
  detailLoading: Ref<boolean>;
  detailError: Ref<string>;
}

export interface InterviewHistoryPageContext {
  route: ReturnType<typeof useRoute>;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useI18n>["t"];
  localeValue: () => unknown;
  fallbackLocaleValue: () => unknown;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  sessions: ReturnType<typeof useInterview>["sessions"];
  fetchSessions: ReturnType<typeof useInterview>["fetchSessions"];
  getSession: ReturnType<typeof useInterview>["getSession"];
  state: InterviewHistoryPageState;
}
