import type { PortfolioData, PortfolioProject } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

/**
 * Portfolio management composable.
 */
export function usePortfolio() {
  const api = useApi();
  const portfolio = useState<PortfolioData | null>(STATE_KEYS.PORTFOLIO_DATA, () => null);
  const projects = useState<PortfolioProject[]>(STATE_KEYS.PORTFOLIO_PROJECTS, () => []);
  const loading = useState(STATE_KEYS.PORTFOLIO_LOADING, () => false);

  async function fetchPortfolio() {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.get();
      if (error) throw new Error("Failed to fetch portfolio");
      portfolio.value = data;
      if (data && Array.isArray((data as PortfolioData).projects)) {
        projects.value = (data as PortfolioData).projects;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updatePortfolio(updates: Partial<PortfolioData>) {
    loading.value = true;
    try {
      const { data, error } = await api.portfolio.put(updates);
      if (error) throw new Error("Failed to update portfolio");
      portfolio.value = data;
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
    exportPortfolio,
  };
}
