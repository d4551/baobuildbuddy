import type { AsyncData } from "#app";
import type { MaybeRef } from "vue";

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
  createdAt: string;
  updatedAt: string;
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
    const normalizedTarget = baseIsApi && normalizedPath.startsWith("/api/")
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

  return {
    triggerJobApply,
    fetchRuns,
    fetchRun,
  };
}
