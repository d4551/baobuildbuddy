import {
  API_ENDPOINTS,
  type AutomationRunStatus,
  type AutomationRunType,
  buildAutomationRunEndpoint,
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
  rpaRunEventSchema,
  safeParseJson,
  WS_ENDPOINTS,
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

interface AutomationRuntime {
  apiBase: string;
  wsBase: string;
  requestUrl: URL;
}

function resolveAutomationRuntime(
  config: ReturnType<typeof useRuntimeConfig>,
  requestUrl: URL,
): AutomationRuntime {
  return {
    apiBase: String(config.public.apiBase || "/"),
    wsBase: String(config.public.wsBase || config.public.apiBase || "/"),
    requestUrl,
  };
}

function createRunMutations(runtime: AutomationRuntime) {
  const triggerJobApply = (body: JobApplyBody) =>
    $fetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, API_ENDPOINTS.automationJobApply),
      {
        method: "POST",
        body,
      },
    );

  const scheduleJobApply = (body: ScheduleJobApplyBody) =>
    $fetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(
        runtime.apiBase,
        runtime.requestUrl,
        API_ENDPOINTS.automationJobApplySchedule,
      ),
      {
        method: "POST",
        body,
      },
    );

  const triggerEmailResponse = (body: EmailResponseBody) =>
    $fetch<EmailAutomationResponse>(
      resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, API_ENDPOINTS.automationEmailResponse),
      {
        method: "POST",
        body,
      },
    );

  return {
    triggerJobApply,
    scheduleJobApply,
    triggerEmailResponse,
  };
}

function createRunQueries(runtime: AutomationRuntime) {
  const runsEndpoint = resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, API_ENDPOINTS.automationRuns);

  const fetchRuns = (params: MaybeRef<FetchRunsParams> = {}) =>
    useFetch<RpaRunExecutionEnvelope[]>(runsEndpoint, {
      query: params,
    });

  const fetchRun = (id: string) =>
    useFetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, buildAutomationRunEndpoint(id)),
    );

  const getRun = (id: string) =>
    $fetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, buildAutomationRunEndpoint(id)),
    );

  const getRuns = (params: FetchRunsParams = {}) =>
    $fetch<RpaRunExecutionEnvelope[]>(runsEndpoint, {
      query: params,
    });

  return {
    fetchRuns,
    fetchRun,
    getRun,
    getRuns,
  };
}

function createRunSubscription(runtime: AutomationRuntime) {
  return (runId: string, onEvent: (event: RpaRunEvent) => void): (() => void) => {
    const wsUrl = resolveWebSocketEndpoint(runtime.wsBase, runtime.requestUrl, WS_ENDPOINTS.automation);
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
      if (typeof event.data !== "string") {
        return;
      }
      const parsedPayload = safeParseJson(event.data);
      const parsedEvent = rpaRunEventSchema.safeParse(parsedPayload);
      if (parsedEvent.success) {
        onEvent(parsedEvent.data);
      }
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
}

/**
 * Automation feature composable using shared run/event contracts.
 */
export function useAutomation() {
  const runtime = resolveAutomationRuntime(useRuntimeConfig(), useRequestURL());

  return {
    ...createRunMutations(runtime),
    ...createRunQueries(runtime),
    subscribeToRun: createRunSubscription(runtime),
  };
}
