import type {
  AutomationRunStatus,
  AutomationRunType,
  AutomationScrapeTarget,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
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
import { type MaybeRef, toValue } from "vue";
import { useAsyncData, useRuntimeConfig } from "#imports";
import { assertApiResponse } from "~/composables/async-flow";
import { useClientApiRequestRuntime } from "~/composables/api-request";
import { useApi } from "~/composables/useApi";
import { resolveWebSocketEndpoint } from "~/utils/endpoints";

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

type RunListAsyncData = AsyncData<RpaRunExecutionEnvelope[] | undefined, FetchError | undefined>;
type RunAsyncData = AsyncData<RpaRunExecutionEnvelope | undefined, FetchError | undefined>;
type CapabilityAuditAsyncData = AsyncData<
  RpaCapabilityAuditReport | undefined,
  FetchError | undefined
>;

function asRunEnvelope(data: unknown): RpaRunExecutionEnvelope {
  return data as RpaRunExecutionEnvelope;
}

function asRunEnvelopeList(data: unknown): RpaRunExecutionEnvelope[] {
  return Array.isArray(data) ? (data as RpaRunExecutionEnvelope[]) : [];
}

function asCapabilityReport(data: unknown): RpaCapabilityAuditReport {
  return data as RpaCapabilityAuditReport;
}

/**
 * Automation feature composable — Eden Treaty for HTTP; WS for live run events.
 */
export function useAutomation() {
  const api = useApi();
  const config = useRuntimeConfig();
  const runtime = useClientApiRequestRuntime();
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");

  const triggerJobApply = async (body: JobApplyBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation["job-apply"].post(body);
    assertApiResponse(error, "Job apply trigger failed");
    return asRunEnvelope(data);
  };

  const scheduleJobApply = async (body: ScheduleJobApplyBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation["job-apply"].schedule.post(body);
    assertApiResponse(error, "Job apply schedule failed");
    return asRunEnvelope(data);
  };

  const triggerEmailResponse = async (body: EmailResponseRequest): Promise<EmailResponseResult> => {
    const { data, error } = await api.automation["email-response"].post(body);
    assertApiResponse(error, "Email response trigger failed");
    return data as EmailResponseResult;
  };

  const scheduleEmailResponse = async (
    body: ScheduleEmailResponseBody,
  ): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation["email-response"].schedule.post(body);
    assertApiResponse(error, "Email response schedule failed");
    return asRunEnvelope(data);
  };

  const triggerScrape = async (body: RunScrapeBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation.scrape.post(body);
    assertApiResponse(error, "Scrape trigger failed");
    return asRunEnvelope(data);
  };

  const scheduleScrape = async (body: ScheduleScrapeBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation.scrape.schedule.post(body);
    assertApiResponse(error, "Scrape schedule failed");
    return asRunEnvelope(data);
  };

  const getVerifyContext = async (): Promise<{ resumeId: string } | null> => {
    const result = await settle(api.automation.verify.context.get());
    if (result.status !== "fulfilled") {
      return null;
    }
    const { data, error } = result.value;
    if (error || !data || typeof data.resumeId !== "string" || data.resumeId.length === 0) {
      return null;
    }
    return { resumeId: data.resumeId };
  };

  const getRun = async (id: string): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation.runs({ id }).get();
    assertApiResponse(error, "Automation run fetch failed");
    return asRunEnvelope(data);
  };

  const getRuns = async (params: FetchRunsParams = {}): Promise<RpaRunExecutionEnvelope[]> => {
    const { data, error } = await api.automation.runs.get({
      query: {
        type: params.type,
        status: params.status,
      },
    });
    assertApiResponse(error, "Automation runs fetch failed");
    return asRunEnvelopeList(data);
  };

  const getRpaCapabilities = async (): Promise<RpaCapabilityAuditReport> => {
    const { data, error } = await api.automation.capabilities.get();
    assertApiResponse(error, "RPA capabilities fetch failed");
    return asCapabilityReport(data);
  };

  const fetchRuns = (params: MaybeRef<FetchRunsParams> = {}): RunListAsyncData =>
    useAsyncData(
      "automation-runs-list",
      async () => {
        const resolved = toValue(params);
        return getRuns(resolved);
      },
      {
        watch: [() => toValue(params)],
      },
    ) as RunListAsyncData;

  const fetchRun = (id: string): RunAsyncData =>
    useAsyncData(`automation-run-${id}`, async () => getRun(id)) as RunAsyncData;

  const fetchRpaCapabilities = (): CapabilityAuditAsyncData =>
    useAsyncData("automation-rpa-capabilities", async () => getRpaCapabilities()) as CapabilityAuditAsyncData;

  const subscribeToRun = (runId: string, onEvent: (event: RpaRunEvent) => void): (() => void) => {
    const wsUrl = resolveWebSocketEndpoint(wsBase, runtime.requestUrl, WS_ENDPOINTS.automation);
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

  return {
    triggerJobApply,
    scheduleJobApply,
    triggerEmailResponse,
    scheduleEmailResponse,
    triggerScrape,
    scheduleScrape,
    fetchRuns,
    fetchRun,
    getRun,
    getRuns,
    fetchRpaCapabilities,
    getRpaCapabilities,
    getVerifyContext,
    subscribeToRun,
  };
}
