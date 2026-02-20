import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
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
      assertApiResponse(error, "Failed to fetch portfolio");
      hydratePortfolio(toPortfolioData(data));
    });
  }

  async function updatePortfolio(updates: Partial<PortfolioMetadata>) {
    return withLoadingState(loading, async () => {
      const payload: UpdatePortfolioPayload = { metadata: updates };
      const { data, error } = await api.portfolio.put(payload);
      assertApiResponse(error, "Failed to update portfolio");
      const normalized = toPortfolioData(data);
      hydratePortfolio(normalized);
      return normalized;
    });
  }

  async function addProject(projectData: CreateProjectPayload) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.projects.post(projectData);
      assertApiResponse(error, "Failed to add project");
      await fetchPortfolio();
      return data;
    });
  }

  async function updateProject(id: string, updates: UpdateProjectPayload) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.projects({ id }).put(updates);
      assertApiResponse(error, "Failed to update project");
      await fetchPortfolio();
      return data;
    });
  }

  async function deleteProject(id: string) {
    return withLoadingState(loading, async () => {
      const { error } = await api.portfolio.projects({ id }).delete();
      assertApiResponse(error, "Failed to delete project");
      await fetchPortfolio();
    });
  }

  async function reorderProjects(orderedIds: string[]) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.projects.reorder.post({ orderedIds });
      assertApiResponse(error, "Failed to reorder projects");
      const normalized = toPortfolioData(data);
      hydratePortfolio(normalized);
      return normalized;
    });
  }

  async function exportPortfolio() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.portfolio.export.post();
      assertApiResponse(error, "Failed to export portfolio");
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
