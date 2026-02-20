import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { toPortfolioData } from "./api-normalizers";

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
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.get();
      if (error) throw new Error("Failed to fetch portfolio");
      hydratePortfolio(toPortfolioData(data));
    } finally {
      loading.value = false;
    }
  }

  async function updatePortfolio(updates: Partial<PortfolioMetadata>) {
    loading.value = true;
    try {
      const payload: UpdatePortfolioPayload = { metadata: updates };
      const { data, error } = await api.portfolio.put(payload);
      if (error) throw new Error("Failed to update portfolio");
      const normalized = toPortfolioData(data);
      hydratePortfolio(normalized);
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function addProject(projectData: CreateProjectPayload) {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.projects.post(projectData);
      if (error) throw new Error("Failed to add project");
      await fetchPortfolio();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function updateProject(id: string, updates: UpdateProjectPayload) {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.projects({ id }).put(updates);
      if (error) throw new Error("Failed to update project");
      await fetchPortfolio();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProject(id: string) {
    loading.value = true;
    try {
      const { error } = await api.portfolio.projects({ id }).delete();
      if (error) throw new Error("Failed to delete project");
      await fetchPortfolio();
    } finally {
      loading.value = false;
    }
  }

  async function reorderProjects(orderedIds: string[]) {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.projects.reorder.post({ orderedIds });
      if (error) throw new Error("Failed to reorder projects");
      const normalized = toPortfolioData(data);
      hydratePortfolio(normalized);
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function exportPortfolio() {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.export.post();
      if (error) throw new Error("Failed to export portfolio");
      return data;
    } finally {
      loading.value = false;
    }
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
