import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type {
  PortfolioData,
  PortfolioMetadata,
  PortfolioProject,
} from "@bao/shared/types/portfolio";
import { isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { toPortfolioData } from "./api-normalizer-portfolio";
import {
  type ClientApiRequestRuntime,
  downloadApiFile,
  useClientApiRequestRuntime,
} from "./api-request";
import { assertApiResponse, withLoadingState } from "./async-flow";

type ApiClient = ReturnType<typeof useApi>;
type UpdatePortfolioPayload = NonNullable<Parameters<ApiClient["portfolio"]["put"]>[0]>;
type CreateProjectPayload = NonNullable<Parameters<ApiClient["portfolio"]["projects"]["post"]>[0]>;
type ProjectRoute = ReturnType<ApiClient["portfolio"]["projects"]>;
type UpdateProjectPayload = NonNullable<Parameters<ProjectRoute["put"]>[0]>;

interface PortfolioContext {
  api: ApiClient;
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
  portfolio: ReturnType<typeof useState<PortfolioData | null>>;
  projects: ReturnType<typeof useState<PortfolioProject[]>>;
  runtime: ClientApiRequestRuntime;
}

const readApiData = async (
  request: Promise<unknown>,
  fallbackMessage: string,
): Promise<unknown> => {
  const response = await request;
  if (!(isRecord(response) && "data" in response)) {
    throw new Error(fallbackMessage);
  }
  if ("error" in response && response.error) {
    throw new Error(fallbackMessage);
  }
  return response.data;
};

function hydratePortfolio(context: PortfolioContext, next: PortfolioData | null): void {
  context.portfolio.value = next;
  context.projects.value = next && Array.isArray(next.projects) ? next.projects : [];
}

async function fetchPortfolio(context: PortfolioContext): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const data = await readApiData(
      context.api.portfolio.get(),
      context.t("apiErrors.portfolio.fetchFailed"),
    );
    hydratePortfolio(context, toPortfolioData(data));
  });
}

async function updatePortfolio(
  context: PortfolioContext,
  updates: Partial<PortfolioMetadata>,
): Promise<PortfolioData | null> {
  return withLoadingState(context.loading, async () => {
    const payload: UpdatePortfolioPayload = { metadata: updates };
    const data = await readApiData(
      context.api.portfolio.put(payload),
      context.t("apiErrors.portfolio.updateFailed"),
    );
    const normalized = toPortfolioData(data);
    hydratePortfolio(context, normalized);
    return normalized;
  });
}

async function addProject(
  context: PortfolioContext,
  projectData: CreateProjectPayload,
): Promise<void> {
  return withLoadingState(context.loading, async () => {
    await readApiData(
      context.api.portfolio.projects.post(projectData),
      context.t("apiErrors.portfolio.addProjectFailed"),
    );
    await fetchPortfolio(context);
  });
}

async function updateProject(
  context: PortfolioContext,
  id: string,
  updates: UpdateProjectPayload,
): Promise<void> {
  return withLoadingState(context.loading, async () => {
    await readApiData(
      context.api.portfolio.projects({ id }).put(updates),
      context.t("apiErrors.portfolio.updateProjectFailed"),
    );
    await fetchPortfolio(context);
  });
}

async function deleteProject(context: PortfolioContext, id: string): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const { error } = await context.api.portfolio.projects({ id }).delete();
    assertApiResponse(error, context.t("apiErrors.portfolio.deleteProjectFailed"));
    await fetchPortfolio(context);
  });
}

async function reorderProjects(context: PortfolioContext, orderedIds: string[]): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const data = await readApiData(
      context.api.portfolio.projects.reorder.post({ orderedIds }),
      context.t("apiErrors.portfolio.reorderFailed"),
    );
    const normalized = toPortfolioData(data);
    hydratePortfolio(context, normalized);
  });
}

async function exportPortfolio(
  context: PortfolioContext,
  format?: string,
  template?: string,
): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const body: { format?: string; template?: string } = {};
    if (format) {
      body.format = format;
    }
    if (template) {
      body.template = template;
    }
    await downloadApiFile(
      context.runtime,
      `${API_ENDPOINTS.portfolio}/export`,
      {
        method: "POST",
        body,
      },
      `portfolio.${format === "docx" ? "docx" : "pdf"}`,
    );
  });
}

/**
 * Portfolio management composable.
 */
export function usePortfolio() {
  const context: PortfolioContext = {
    api: useApi(),
    t: useI18n().t,
    portfolio: useState<PortfolioData | null>(STATE_KEYS.PORTFOLIO_DATA, () => null),
    projects: useState<PortfolioProject[]>(STATE_KEYS.PORTFOLIO_PROJECTS, () => []),
    loading: useState(STATE_KEYS.PORTFOLIO_LOADING, () => false),
    runtime: useClientApiRequestRuntime(),
  };

  return {
    portfolio: readonly(context.portfolio),
    projects: readonly(context.projects),
    loading: readonly(context.loading),
    fetchPortfolio: () => fetchPortfolio(context),
    updatePortfolio: (updates: Partial<PortfolioMetadata>) => updatePortfolio(context, updates),
    addProject: (projectData: CreateProjectPayload) => addProject(context, projectData),
    updateProject: (id: string, updates: UpdateProjectPayload) =>
      updateProject(context, id, updates),
    deleteProject: (id: string) => deleteProject(context, id),
    reorderProjects: (orderedIds: string[]) => reorderProjects(context, orderedIds),
    exportPortfolio: (format?: string, template?: string) =>
      exportPortfolio(context, format, template),
  };
}
