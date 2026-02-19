import type { InterviewSession } from "@navi/shared";
import { STATE_KEYS } from "@navi/shared";

/**
 * Interview practice session management composable.
 */
export function useInterview() {
  const api = useApi();
  const sessions = useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []);
  const currentSession = useState<InterviewSession | null>(STATE_KEYS.INTERVIEW_CURRENT_SESSION, () => null);
  const stats = useState<Record<string, number> | null>(STATE_KEYS.INTERVIEW_STATS, () => null);
  const loading = useState(STATE_KEYS.INTERVIEW_LOADING, () => false);

  async function startSession(studioId: string, config?: Record<string, unknown>) {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions.post({ studioId, config });
      if (error) throw new Error("Failed to start interview session");
      currentSession.value = data;
      await fetchSessions();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSessions() {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions.get();
      if (error) throw new Error("Failed to fetch interview sessions");
      sessions.value = data as InterviewSession[];
    } finally {
      loading.value = false;
    }
  }

  async function getSession(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions[id].get();
      if (error) throw new Error("Failed to fetch interview session");
      currentSession.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function submitResponse(sessionId: string, response: Record<string, unknown>) {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions[sessionId].response.post(response);
      if (error) throw new Error("Failed to submit response");
      currentSession.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function completeSession(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions[id].complete.post();
      if (error) throw new Error("Failed to complete session");
      currentSession.value = data;
      await fetchSessions();
      await fetchStats();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    loading.value = true;
    try {
      const { data, error } = await api.interview.stats.get();
      if (error) throw new Error("Failed to fetch interview stats");
      stats.value = data;
    } finally {
      loading.value = false;
    }
  }

  return {
    sessions: readonly(sessions),
    currentSession: readonly(currentSession),
    stats: readonly(stats),
    loading: readonly(loading),
    startSession,
    fetchSessions,
    getSession,
    submitResponse,
    completeSession,
    fetchStats,
  };
}
