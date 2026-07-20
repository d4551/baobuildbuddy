import type {
  AutomationRunStatus,
  AutomationRunType,
  AutomationScrapeTarget,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import {
  API_ENDPOINTS,
  buildAutomationRunEndpoint,
  WS_ENDPOINTS,
} from "@bao/shared/constants/endpoints";
import type {
  EmailResponseRequest,
  EmailResponseResult,
} from "@bao/shared/schemas/automation-email.schema";
import {
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
  rpaRunEventSchema,
} from "@bao/shared/schemas/rpa-events.schema";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import type { AsyncData } from "nuxt/app";
import type { FetchError } from "ofetch";
import type { MaybeRef } from "vue";
import { useFetch, useRuntimeConfig } from "#imports";
import {
  buildClientApiHeaders,
  type ClientApiRequestRuntime,
  requestApi,
  useClientApiRequestRuntime,
} from "~/composables/api-request";
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
  api: ClientApiRequestRuntime;
  wsBase: string;
}

type RunListAsyncData = AsyncData<RpaRunExecutionEnvelope[] | undefined, FetchError | undefined>;
type RunAsyncData = AsyncData<RpaRunExecutionEnvelope | undefined, FetchError | undefined>;
type CapabilityAuditAsyncData = AsyncData<
  RpaCapabilityAuditReport | undefined,
  FetchError | undefined
>;

function createPostMutation(runtime: AutomationRuntime) {
  return <TResponse>(endpoint: string, body: object): Promise<TResponse> =>
    requestApi<TResponse>(runtime.api, endpoint, {
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

async function getVerifyContext(
  runtime: AutomationRuntime,
): Promise<{ resumeId: string } | null> {
  const result = await settle(
    requestApi<{ resumeId: string }>(runtime.api, API_ENDPOINTS.automationVerifyContext, {
      method: "GET",
    }),
  );
  if (result.status !== "fulfilled") {
    return null;
  }
  const payload = result.value;
  if (payload && typeof payload.resumeId === "string" && payload.resumeId.length > 0) {
    return { resumeId: payload.resumeId };
  }
  return null;
}

function createRunQueries(runtime: AutomationRuntime) {
  const authHeaders = buildClientApiHeaders();
  const runsEndpoint = resolveApiEndpoint(
    runtime.api.apiBase,
    runtime.api.requestUrl,
    API_ENDPOINTS.automationRuns,
  );

  const fetchRuns = (params: MaybeRef<FetchRunsParams> = {}): RunListAsyncData =>
    useFetch<RpaRunExecutionEnvelope[]>(runsEndpoint, {
      query: params,
      headers: authHeaders,
    });

  const fetchRun = (id: string): RunAsyncData =>
    useFetch<RpaRunExecutionEnvelope>(
      resolveApiEndpoint(
        runtime.api.apiBase,
        runtime.api.requestUrl,
        buildAutomationRunEndpoint(id),
      ),
      {
        headers: authHeaders,
      },
    );

  const getRun = (id: string): Promise<RpaRunExecutionEnvelope> =>
    requestApi<RpaRunExecutionEnvelope>(runtime.api, buildAutomationRunEndpoint(id), {
      method: "GET",
    });

  const getRuns = (params: FetchRunsParams = {}): Promise<RpaRunExecutionEnvelope[]> =>
    requestApi<RpaRunExecutionEnvelope[]>(runtime.api, API_ENDPOINTS.automationRuns, {
      method: "GET",
      query: {
        type: params.type,
        status: params.status,
      },
    });

  const fetchRpaCapabilities = (): CapabilityAuditAsyncData =>
    useFetch<RpaCapabilityAuditReport>(
      resolveApiEndpoint(
        runtime.api.apiBase,
        runtime.api.requestUrl,
        API_ENDPOINTS.automationCapabilities,
      ),
      {
        headers: authHeaders,
      },
    );

  const getRpaCapabilities = (): Promise<RpaCapabilityAuditReport> =>
    requestApi<RpaCapabilityAuditReport>(runtime.api, API_ENDPOINTS.automationCapabilities, {
      method: "GET",
    });

  return {
    fetchRuns,
    fetchRun,
    getRun,
    getRuns,
    fetchRpaCapabilities,
    getRpaCapabilities,
    getVerifyContext: () => getVerifyContext(runtime),
  };
}

function createRunSubscription(runtime: AutomationRuntime) {
  return (runId: string, onEvent: (event: RpaRunEvent) => void): (() => void) => {
    const wsUrl = resolveWebSocketEndpoint(
      runtime.wsBase,
      runtime.api.requestUrl,
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
  const config = useRuntimeConfig();
  const runtime: AutomationRuntime = {
    api: useClientApiRequestRuntime(),
    wsBase: String(config.public.wsBase || config.public.apiBase || "/"),
  };

  return {
    ...createRunMutations(runtime),
    ...createRunQueries(runtime),
    subscribeToRun: createRunSubscription(runtime),
  };
}
