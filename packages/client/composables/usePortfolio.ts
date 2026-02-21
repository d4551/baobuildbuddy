import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { toPortfolioData } from "./api-normalizers";
import { assertApiResponse, withLoadingState } from "./async-flow";

type ApiClient = ReturnType<typeof useApi>;
type UpdatePortfolioPayload = NonNullable<Parameters<ApiClient["portfolio"]["put"]>[0]>;
type CreateProjectPayload = NonNullable<Parameters<ApiClient["portfolio"]["projects"]["post"]>[0]>;
type ProjectRoute = ReturnType<ApiClient["portfolio"]["projects"]>;
type UpdateProjectPayload = NonNullable<Parameters<ProjectRoute["put"]>[0]>;

/**
 * Portfolio management composable.
 */
export function usePortfolio() {
  const api = useApi();
  const { t } = useI18n();
  const portfolio = useState<PortfolioData | null>(STATE_KEYS.PORTFOLIO_DATA, () => null);
  const projects = useState<PortfolioProject[]>(STATE_KEYS.PORTFOLIO_PROJECTS, () => []);
  const loading = useState(STATE_KEYS.PORTFOLIO_LOADING, () => false);

  function hydratePortfolio(next: PortfolioData | null): void {
    portfolio.value = next;
    if (next && Array.isArray(next.projects)) {
      projects.value = next.projects;
      return;
    }
    projects.value = [];
  }

  async function fetchPortfolio() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.get();
      assertApiResponse(error, t("apiErrors.portfolio.fetchFailed"));
      hydratePortfolio(toPortfolioData(data));
    });
  }

  async function updatePortfolio(updates: Partial<PortfolioMetadata>) {
    return withLoadingState(loading, async () => {
      const payload: UpdatePortfolioPayload = { metadata: updates };
      const { data, error } = await api.portfolio.put(payload);
      assertApiResponse(error, t("apiErrors.portfolio.updateFailed"));
      const normalized = toPortfolioData(data);
      hydratePortfolio(normalized);
      return normalized;
    });
  }

  async function addProject(projectData: CreateProjectPayload) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.projects.post(projectData);
      assertApiResponse(error, t("apiErrors.portfolio.addProjectFailed"));
      await fetchPortfolio();
      return data;
    });
  }

  async function updateProject(id: string, updates: UpdateProjectPayload) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.projects({ id }).put(updates);
      assertApiResponse(error, t("apiErrors.portfolio.updateProjectFailed"));
      await fetchPortfolio();
      return data;
    });
  }

  async function deleteProject(id: string) {
    return withLoadingState(loading, async () => {
      const { error } = await api.portfolio.projects({ id }).delete();
      assertApiResponse(error, t("apiErrors.portfolio.deleteProjectFailed"));
      await fetchPortfolio();
    });
  }

  async function reorderProjects(orderedIds: string[]) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.projects.reorder.post({ orderedIds });
      assertApiResponse(error, t("apiErrors.portfolio.reorderFailed"));
      const normalized = toPortfolioData(data);
      hydratePortfolio(normalized);
      return normalized;
    });
  }

  async function exportPortfolio() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.export.post();
      assertApiResponse(error, t("apiErrors.portfolio.exportFailed"));
      return data;
    });
  }

  return {
    portfolio: readonly(portfolio),
    projects: readonly(projects),
    loading: readonly(loading),
    fetchPortfolio,
    updatePortfolio,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    exportPortfolio,
  };
}
