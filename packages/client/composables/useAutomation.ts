import {
  API_ENDPOINTS,
  WS_ENDPOINTS,
  AUTOMATION_RUN_STATUSES,
  buildAutomationRunEndpoint,
  safeParseJson,
  type AutomationRunStatus,
  type AutomationRunType,
} from "@bao/shared";
import type { MaybeRef } from "vue";
import { resolveApiEndpoint, resolveWebSocketEndpoint } from "~/utils/endpoints";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

export interface AutomationRun {
  id: string;
  type: AutomationRunType;
  status: AutomationRunStatus;
  jobId: string | null;
  userId: string | null;
  input: JsonObject | null;
  output: JsonValue | null;
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
  status?: AutomationRunStatus;
  message?: string;
  success?: boolean;
  error?: string | null;
}

interface JobApplyBody {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers?: Record<string, string>;
}

interface ScheduleJobApplyBody extends JobApplyBody {
  runAt: string;
}

type EmailResponseTone = "professional" | "friendly" | "concise";

interface EmailResponseBody {
  subject: string;
  message: string;
  sender?: string;
  tone?: EmailResponseTone;
}

interface UseAutomationResponse {
  runId: string;
  status: AutomationRunStatus;
}

interface ScheduleAutomationResponse {
  runId: string;
  status: Extract<AutomationRunStatus, "pending">;
  scheduledFor: string;
}

interface EmailAutomationResponse {
  runId: string;
  status: Extract<AutomationRunStatus, "success">;
  reply: string;
  provider: string;
  model: string;
}

interface FetchRunsParams {
  type?: AutomationRunType;
  status?: AutomationRunStatus;
}

const isJsonObject = (value: JsonValue): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAutomationStatus = (value: string): value is AutomationRunStatus =>
  AUTOMATION_RUN_STATUSES.some((status) => status === value);

const toAutomationProgressEvent = (value: JsonValue): AutomationProgressEvent | null => {
  if (!isJsonObject(value)) {
    return null;
  }

  const runId = value.runId;
  const type = value.type;
  if (typeof runId !== "string" || typeof type !== "string") {
    return null;
  }

  const nextEvent: AutomationProgressEvent = { runId, type };
  if (typeof value.action === "string") nextEvent.action = value.action;
  if (typeof value.step === "number") nextEvent.step = value.step;
  if (typeof value.totalSteps === "number") nextEvent.totalSteps = value.totalSteps;
  if (typeof value.status === "string" && isAutomationStatus(value.status)) {
    nextEvent.status = value.status;
  }
  if (typeof value.message === "string") nextEvent.message = value.message;
  if (typeof value.success === "boolean") nextEvent.success = value.success;
  if (typeof value.error === "string" || value.error === null) nextEvent.error = value.error;
  return nextEvent;
};

/**
 * Automation feature composable using Nuxt useFetch/$fetch without wrapper abstractions.
 */
export function useAutomation() {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const apiBase = String(config.public.apiBase || "/");
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");

  /**
   * Start a job-apply automation run.
   */
  const triggerJobApply = (body: JobApplyBody) => {
    return $fetch<UseAutomationResponse>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationJobApply),
      {
        method: "POST",
        body,
      },
    );
  };

  /**
   * Schedule a job-apply automation run for future execution.
   */
  const scheduleJobApply = (body: ScheduleJobApplyBody) =>
    $fetch<ScheduleAutomationResponse>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationJobApplySchedule),
      {
        method: "POST",
        body,
      },
    );

  /**
   * Generate an AI-assisted email response and persist the run output.
   */
  const triggerEmailResponse = (body: EmailResponseBody) =>
    $fetch<EmailAutomationResponse>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationEmailResponse),
      {
        method: "POST",
        body,
      },
    );

  /**
   * Fetch automation run history with optional type/status filters.
   */
  const fetchRuns = (params: MaybeRef<FetchRunsParams> = {}) =>
    useFetch<AutomationRun[]>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationRuns),
      {
        query: params,
      },
    );

  /**
   * Fetch a single automation run by ID.
   */
  const fetchRun = (id: string) =>
    useFetch<AutomationRun>(
      resolveApiEndpoint(apiBase, requestUrl, buildAutomationRunEndpoint(id)),
    );

  /**
   * Subscribe to real-time progress events for an automation run via WebSocket.
   * Returns an unsubscribe function to close the connection.
   */
  const subscribeToRun = (
    runId: string,
    onProgress: (event: AutomationProgressEvent) => void,
  ): (() => void) => {
    const wsUrl = resolveWebSocketEndpoint(wsBase, requestUrl, WS_ENDPOINTS.automation);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", runId }));
    };

    ws.onmessage = (event) => {
      const parsed = safeParseJson(event.data);
      if (parsed === null) return;
      const normalizedEvent = toAutomationProgressEvent(parsed);
      if (normalizedEvent) {
        onProgress(normalizedEvent);
      }
    };

    ws.onerror = () => {
      // WebSocket error — silent fallback, client can still poll
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "unsubscribe", runId }));
        ws.close();
      }
    };
  };

  return {
    triggerJobApply,
    scheduleJobApply,
    triggerEmailResponse,
    fetchRuns,
    fetchRun,
    subscribeToRun,
  };
}
