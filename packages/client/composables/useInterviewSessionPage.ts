import { onUnmounted } from "vue";
import { createInterviewSessionActions } from "~/composables/interview-session-actions";
import {
  buildInterviewSessionViewModel,
  createInterviewSessionDerivedState,
  createInterviewSessionState,
  registerInterviewSessionWatchers,
} from "~/composables/interview-session-page-state";
import { createInterviewSessionTimer } from "~/composables/interview-session-timer";

export function useInterviewSessionPage() {
  const state = createInterviewSessionState();
  const derived = createInterviewSessionDerivedState(state);
  const timer = createInterviewSessionTimer({
    activeSession: derived.activeSession,
    t: state.t,
  });
  const actions = createInterviewSessionActions({
    canComplete: derived.canComplete,
    canSubmit: derived.canSubmit,
    completeSession: state.completeSession,
    completing: state.completing,
    currentQuestionIndex: derived.currentQuestionIndex,
    currentSessionLoadId: state.currentSessionLoadId,
    getSession: state.getSession,
    isLastQuestion: derived.isLastQuestion,
    response: state.response,
    router: state.router,
    sessionId: derived.sessionId,
    sessionLoadError: state.sessionLoadError,
    stt: state.stt,
    stopTimer: timer.stopTimer,
    submitResponse: state.submitResponse,
    submitting: state.submitting,
    syncCompletedSessionTime: timer.syncCompletedSessionTime,
    startTimer: timer.startTimer,
    t: state.t,
    toast: state.toast,
  });

  registerInterviewSessionWatchers({
    actions,
    derived,
    response: state.response,
    stt: state.stt,
    timer,
    tts: state.tts,
  });

  onUnmounted(() => {
    timer.stopTimer();
    state.tts.cancel();
    state.stt.stopListening();
  });
  return buildInterviewSessionViewModel({ actions, derived, state, timer });
}
