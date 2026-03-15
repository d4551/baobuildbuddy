import {
  API_ENDPOINTS,
  type AutomationScrapeTarget,
  type AutomationRunStatus,
  type AutomationRunType,
  buildAutomationRunEndpoint,
  type EmailResponseRequest,
  type EmailResponseResult,
  type RpaCapabilityAuditReport,
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

interface ScheduleEmailResponseBody extends EmailResponseRequest {
  runAt: string;
}

interface ScheduleScrapeBody {
  target: AutomationScrapeTarget;
  runAt: string;
}

interface RunScrapeBody {
  target: AutomationScrapeTarget;
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

function createPostMutation(runtime: AutomationRuntime) {
  return <TResponse>(endpoint: string, body: object) =>
    $fetch<TResponse>(resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, endpoint), {
      method: "POST",
      body,
    });
}

function createRunMutations(runtime: AutomationRuntime) {
  const postMutation = createPostMutation(runtime);

  const triggerJobApply = (body: JobApplyBody) =>
    postMutation<RpaRunExecutionEnvelope>(API_ENDPOINTS.automationJobApply, body);

  const scheduleJobApply = (body: ScheduleJobApplyBody) =>
    postMutation<RpaRunExecutionEnvelope>(API_ENDPOINTS.automationJobApplySchedule, body);

  const triggerEmailResponse = (body: EmailResponseRequest) =>
    postMutation<EmailResponseResult>(API_ENDPOINTS.automationEmailResponse, body);

  const scheduleEmailResponse = (body: ScheduleEmailResponseBody) =>
    postMutation<RpaRunExecutionEnvelope>(API_ENDPOINTS.automationEmailResponseSchedule, body);

  const triggerScrape = (body: RunScrapeBody) =>
    postMutation<RpaRunExecutionEnvelope>(API_ENDPOINTS.automationScrape, body);

  const scheduleScrape = (body: ScheduleScrapeBody) =>
    postMutation<RpaRunExecutionEnvelope>(API_ENDPOINTS.automationScrapeSchedule, body);

  return {
    triggerJobApply,
    scheduleJobApply,
    triggerEmailResponse,
    scheduleEmailResponse,
    triggerScrape,
    scheduleScrape,
  };
}

function createRunQueries(runtime: AutomationRuntime) {
  const runsEndpoint = resolveApiEndpoint(
    runtime.apiBase,
    runtime.requestUrl,
    API_ENDPOINTS.automationRuns,
  );

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

  const fetchRpaCapabilities = () =>
    useFetch<RpaCapabilityAuditReport>(
      resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, API_ENDPOINTS.automationCapabilities),
    );

  const getRpaCapabilities = () =>
    $fetch<RpaCapabilityAuditReport>(
      resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, API_ENDPOINTS.automationCapabilities),
    );

  return {
    fetchRuns,
    fetchRun,
    getRun,
    getRuns,
    fetchRpaCapabilities,
    getRpaCapabilities,
  };
}

function createRunSubscription(runtime: AutomationRuntime) {
  return (runId: string, onEvent: (event: RpaRunEvent) => void): (() => void) => {
    const wsUrl = resolveWebSocketEndpoint(
      runtime.wsBase,
      runtime.requestUrl,
      WS_ENDPOINTS.automation,
    );
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
