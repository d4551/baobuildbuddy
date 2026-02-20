import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

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
    }
  }

  async function fetchPortfolio() {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.get();
      if (error) throw new Error("Failed to fetch portfolio");
      hydratePortfolio(data as PortfolioData | null);
    } finally {
      loading.value = false;
    }
  }

  async function updatePortfolio(updates: Partial<PortfolioMetadata>) {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.put({ metadata: updates });
      if (error) throw new Error("Failed to update portfolio");
      hydratePortfolio(data);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function addProject(projectData: Partial<PortfolioProject>) {
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

  async function updateProject(id: string, updates: Partial<PortfolioProject>) {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.projects[id].put(updates);
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
      const { error } = await api.portfolio.projects[id].delete();
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
      hydratePortfolio(data);
      return data;
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
