import type { ComputedRef } from "vue";
const NUM_1000 = 1000;

interface TimedInterviewSession {
  endTime?: number | null;
  startTime: number;
  status: string;
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

const SESSION_TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const DEFAULT_TIMER_VALUE = 0;
const TIMER_DISPLAY_DIGITS = 2;
const TIMER_DURATION_PREFIX = "PT";
const TIMER_MINUTE_SUFFIX = "M";
const TIMER_SECOND_SUFFIX = "S";

function estimateElapsedTime(
  fallbackSeconds: number,
  startTime: number | undefined,
  endTime?: number | null,
): number {
  if (!startTime) {
    return fallbackSeconds;
  }

  const start = Number.isFinite(startTime) ? startTime : fallbackSeconds;
  const end = typeof endTime === "number" && Number.isFinite(endTime) ? endTime : Date.now();
  const rawSeconds = Math.floor((end - start) / NUM_1000);
  return Math.max(0, rawSeconds);
}

export function createInterviewSessionTimer(input: {
  activeSession: ComputedRef<TimedInterviewSession | null>;
  t: Translate;
}) {
  const timeElapsed = ref(DEFAULT_TIMER_VALUE);
  const timer = ref<number | null>(null);

  const presentation = createInterviewTimerPresentation(timeElapsed, input.t);
  const controls = createInterviewTimerControls({
    activeSession: input.activeSession,
    timeElapsed,
    timer,
  });

  return {
    ...presentation,
    ...controls,
  };
}

function createInterviewTimerPresentation(timeElapsed: Ref<number>, t: Translate) {
  const elapsedMinutes = computed(() => Math.floor(timeElapsed.value / SECONDS_PER_MINUTE));
  const elapsedSeconds = computed(() => timeElapsed.value % SECONDS_PER_MINUTE);
  const formattedElapsedMinutes = computed(() =>
    String(elapsedMinutes.value).padStart(TIMER_DISPLAY_DIGITS, "0"),
  );
  const formattedElapsedSeconds = computed(() =>
    String(elapsedSeconds.value).padStart(TIMER_DISPLAY_DIGITS, "0"),
  );
  const elapsedTimeText = computed(
    () => `${formattedElapsedMinutes.value}:${formattedElapsedSeconds.value}`,
  );
  const elapsedTimeAriaLabel = computed(() =>
    t("interviewSession.timeAria", {
      minutes: elapsedMinutes.value,
      seconds: elapsedSeconds.value,
    }),
  );
  const elapsedTimeDuration = computed(
    () =>
      `${TIMER_DURATION_PREFIX}${elapsedMinutes.value}${TIMER_MINUTE_SUFFIX}${elapsedSeconds.value}${TIMER_SECOND_SUFFIX}`,
  );

  return {
    elapsedTimeAriaLabel,
    elapsedTimeDuration,
    elapsedTimeText,
  };
}

function createInterviewTimerControls(input: {
  activeSession: ComputedRef<TimedInterviewSession | null>;
  timeElapsed: Ref<number>;
  timer: Ref<number | null>;
}) {
  function stopTimer() {
    if (import.meta.client && input.timer.value) {
      window.clearInterval(input.timer.value);
      input.timer.value = null;
    }
  }

  function syncCompletedSessionTime(session: TimedInterviewSession) {
    input.timeElapsed.value = estimateElapsedTime(
      DEFAULT_TIMER_VALUE,
      session.startTime,
      session.endTime,
    );
  }

  function startTimer() {
    stopTimer();
    const session = input.activeSession.value;
    if (!session || session.status === "completed" || session.status === "cancelled") {
      return;
    }

    input.timeElapsed.value = estimateElapsedTime(DEFAULT_TIMER_VALUE, session.startTime);
    if (!import.meta.client) {
      return;
    }
    input.timer.value = window.setInterval(() => {
      const current = input.activeSession.value;
      if (!current) {
        stopTimer();
        return;
      }
      if (current.status === "completed" || current.status === "cancelled") {
        syncCompletedSessionTime(current);
        stopTimer();
        return;
      }
      input.timeElapsed.value = estimateElapsedTime(DEFAULT_TIMER_VALUE, current.startTime);
    }, SESSION_TIMER_INTERVAL_MS);
  }

  return {
    startTimer,
    stopTimer,
    syncCompletedSessionTime,
  };
}
