import type { MaybeRef } from "vue";
import type { AsyncData } from "#app";

export interface AutomationRun {
  id: string;
  type: string;
  status: string;
  jobId: string | null;
  userId: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  screenshots: string[] | null;
  error: string | null;
  progress: number | null;
  currentStep: number | null;
  totalSteps: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationProgressEvent {
  type: string;
  runId: string;
  action?: string;
  step?: number;
  totalSteps?: number;
  status?: string;
  message?: string;
  success?: boolean;
  error?: string | null;
}

interface JobApplyBody {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
}

interface UseAutomationResponse {
  runId: string;
  status: string;
}

interface FetchRunsParams {
  type?: string;
  status?: string;
}

/**
 * Automation feature composable using Nuxt useFetch/$fetch without wrapper abstractions.
 */
export function useAutomation() {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const apiBase = String(config.public.apiBase || "/");
  const resolvedApiBase = new URL(apiBase, requestUrl).toString().replace(/\/$/, "");

  const resolveEndpoint = (path: string): string => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const baseIsApi = /\/api\/?$/i.test(new URL(resolvedApiBase).pathname);
    const normalizedTarget =
      baseIsApi && normalizedPath.startsWith("/api/")
        ? normalizedPath.replace(/^\/api/, "")
        : normalizedPath;

    return `${resolvedApiBase}${normalizedTarget}`;
  };

  /**
   * Start a job-apply automation run.
   */
  const triggerJobApply = (body: JobApplyBody) => {
    return $fetch<UseAutomationResponse>(resolveEndpoint("/api/automation/job-apply"), {
      method: "POST",
      body,
    });
  };

  /**
   * Fetch automation run history with optional type/status filters.
   */
  const fetchRuns = (
    params: MaybeRef<FetchRunsParams> = {},
  ): AsyncData<AutomationRun[] | null, Error | null> =>
    useFetch<AutomationRun[]>(resolveEndpoint("/api/automation/runs"), {
      query: params,
    });

  /**
   * Fetch a single automation run by ID.
   */
  const fetchRun = (id: string): AsyncData<AutomationRun | null, Error | null> =>
    useFetch<AutomationRun>(resolveEndpoint(`/api/automation/runs/${encodeURIComponent(id)}`));

  /**
   * Subscribe to real-time progress events for an automation run via WebSocket.
   * Returns an unsubscribe function to close the connection.
   */
  const subscribeToRun = (
    runId: string,
    onProgress: (event: AutomationProgressEvent) => void,
  ): (() => void) => {
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${location.host}/api/ws/automation`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", runId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AutomationProgressEvent;
        onProgress(data);
      } catch {
        // Non-JSON message, ignore
      }
    };

    ws.onerror = () => {
      // WebSocket error — silent fallback, client can still poll
    };

    return () => {
      try {
        ws.send(JSON.stringify({ type: "unsubscribe", runId }));
        ws.close();
      } catch {
        // Already closed
      }
    };
  };

  return {
    triggerJobApply,
    fetchRuns,
    fetchRun,
    subscribeToRun,
  };
}
