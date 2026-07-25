import type {
  AutomationRunStatus,
  AutomationRunType,
  AutomationScrapeTarget,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import type {
  EmailResponseRequest,
  EmailResponseResult,
} from "@bao/shared/schemas/automation-email.schema";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { settle } from "@bao/shared/utils/promise";
import type { AsyncData } from "nuxt/app";
import type { FetchError } from "ofetch";
import { type MaybeRef, toValue } from "vue";
import { useAsyncData } from "#imports";
import { assertApiResponse } from "~/composables/async-flow";
import type { ClientApi } from "~/types/client-api";

export interface JobApplyBody {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers?: Record<string, string>;
}

export interface ScheduleJobApplyBody extends JobApplyBody {
  runAt: string;
}

export interface ScheduleEmailResponseBody extends EmailResponseRequest {
  runAt: string;
}

export interface ScheduleScrapeBody {
  target: AutomationScrapeTarget;
  runAt: string;
}

export interface RunScrapeBody {
  target: AutomationScrapeTarget;
}

export interface FetchRunsParams {
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

export function createAutomationEdenMutations(api: ClientApi) {
  const triggerJobApply = async (body: JobApplyBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation["job-apply"].post(body);
    assertApiResponse(error, "automation.jobApply.triggerFailed");
    return asRunEnvelope(data);
  };

  const scheduleJobApply = async (body: ScheduleJobApplyBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation["job-apply"].schedule.post(body);
    assertApiResponse(error, "automation.jobApply.scheduleFailed");
    return asRunEnvelope(data);
  };

  const triggerEmailResponse = async (body: EmailResponseRequest): Promise<EmailResponseResult> => {
    const { data, error } = await api.automation["email-response"].post(body);
    assertApiResponse(error, "automation.emailResponse.triggerFailed");
    return data as EmailResponseResult;
  };

  const scheduleEmailResponse = async (
    body: ScheduleEmailResponseBody,
  ): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation["email-response"].schedule.post(body);
    assertApiResponse(error, "automation.emailResponse.scheduleFailed");
    return asRunEnvelope(data);
  };

  const triggerScrape = async (body: RunScrapeBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation.scrape.post(body);
    assertApiResponse(error, "automation.scrape.triggerFailed");
    return asRunEnvelope(data);
  };

  const scheduleScrape = async (body: ScheduleScrapeBody): Promise<RpaRunExecutionEnvelope> => {
    const { data, error } = await api.automation.scrape.schedule.post(body);
    assertApiResponse(error, "automation.scrape.scheduleFailed");
    return asRunEnvelope(data);
  };

  return {
    triggerJobApply,
    scheduleJobApply,
    triggerEmailResponse,
    scheduleEmailResponse,
    triggerScrape,
    scheduleScrape,
  };
}

export function createAutomationEdenQueries(api: ClientApi) {
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
    assertApiResponse(error, "automation.runs.fetchOneFailed");
    return asRunEnvelope(data);
  };

  const getRuns = async (params: FetchRunsParams = {}): Promise<RpaRunExecutionEnvelope[]> => {
    const { data, error } = await api.automation.runs.get({
      query: {
        type: params.type,
        status: params.status,
      },
    });
    assertApiResponse(error, "automation.runs.fetchListFailed");
    return asRunEnvelopeList(data);
  };

  const getRpaCapabilities = async (): Promise<RpaCapabilityAuditReport> => {
    const { data, error } = await api.automation.capabilities.get();
    assertApiResponse(error, "automation.capabilities.fetchFailed");
    return asCapabilityReport(data);
  };

  const fetchRuns = (params: MaybeRef<FetchRunsParams> = {}): RunListAsyncData =>
    useAsyncData("automation-runs-list", async () => getRuns(toValue(params)), {
      watch: [() => toValue(params)],
    }) as RunListAsyncData;

  const fetchRun = (id: string): RunAsyncData =>
    useAsyncData(`automation-run-${id}`, async () => getRun(id)) as RunAsyncData;

  const fetchRpaCapabilities = (): CapabilityAuditAsyncData =>
    useAsyncData("automation-rpa-capabilities", async () =>
      getRpaCapabilities(),
    ) as CapabilityAuditAsyncData;

  return {
    getVerifyContext,
    getRun,
    getRuns,
    getRpaCapabilities,
    fetchRuns,
    fetchRun,
    fetchRpaCapabilities,
  };
}
