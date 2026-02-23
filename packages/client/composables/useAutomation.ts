import {
  API_ENDPOINTS,
  WS_ENDPOINTS,
  buildAutomationRunEndpoint,
  rpaRunEventSchema,
  safeParseJson,
  type AutomationRunStatus,
  type AutomationRunType,
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
} from "@bao/shared";
import type { MaybeRef } from "vue";
import { resolveApiEndpoint, resolveWebSocketEndpoint } from "~/utils/endpoints";

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

/**
 * Automation feature composable using shared run/event contracts.
 */
export function useAutomation() {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const apiBase = String(config.public.apiBase || "/");
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");

  /**
   * Starts a job-apply automation run.
   */
  const triggerJobApply = (body: JobApplyBody) => {
    return $fetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationJobApply),
      {
        method: "POST",
        body,
      },
    );
  };

  /**
   * Schedules a job-apply automation run.
   */
  const scheduleJobApply = (body: ScheduleJobApplyBody) =>
    $fetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationJobApplySchedule),
      {
        method: "POST",
        body,
      },
    );

  /**
   * Generates an AI-assisted email response run.
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
   * Fetches run history with optional type/status filters.
   */
  const fetchRuns = (params: MaybeRef<FetchRunsParams> = {}) =>
    useFetch<RpaRunExecutionEnvelope[]>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationRuns),
      {
        query: params,
      },
    );

  /**
   * Fetches one run by id as reactive async data.
   */
  const fetchRun = (id: string) =>
    useFetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(apiBase, requestUrl, buildAutomationRunEndpoint(id)),
    );

  /**
   * Fetches one run by id as an imperative request.
   */
  const getRun = (id: string) =>
    $fetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(apiBase, requestUrl, buildAutomationRunEndpoint(id)),
    );

  /**
   * Fetches run history as an imperative request.
   */
  const getRuns = (params: FetchRunsParams = {}) =>
    $fetch<RpaRunExecutionEnvelope[]>(
      resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.automationRuns),
      {
        query: params,
      },
    );

  /**
   * Subscribes to run-scoped websocket events.
   */
  const subscribeToRun = (
    runId: string,
    onEvent: (event: RpaRunEvent) => void,
  ): (() => void) => {
    const wsUrl = resolveWebSocketEndpoint(wsBase, requestUrl, WS_ENDPOINTS.automation);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          runId,
        }),
      );
    };

    ws.onmessage = (event) => {
      const parsedPayload = safeParseJson(event.data);
      const parsedEvent = rpaRunEventSchema.safeParse(parsedPayload);
      if (!parsedEvent.success) {
        return;
      }
      onEvent(parsedEvent.data);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "unsubscribe",
            runId,
          }),
        );
      }
      ws.close();
    };
  };

  return {
    triggerJobApply,
    scheduleJobApply,
    triggerEmailResponse,
    fetchRuns,
    fetchRun,
    getRun,
    getRuns,
    subscribeToRun,
  };
}
