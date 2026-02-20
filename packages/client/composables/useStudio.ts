import type { GameStudio } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { toGameStudio } from "./api-normalizers";

type ApiClient = ReturnType<typeof useApi>;
type CreateStudioInput = NonNullable<Parameters<ApiClient["studios"]["post"]>[0]>;
type StudioRoute = ReturnType<ApiClient["studios"]>;
type UpdateStudioInput = NonNullable<Parameters<StudioRoute["put"]>[0]>;

/**
 * Interview studio discovery and analytics composable.
 */
export function useStudio() {
  const api = useApi();
  const studios = useState<GameStudio[]>(STATE_KEYS.STUDIOS_LIST, () => []);
  const currentStudio = useState<GameStudio | null>(STATE_KEYS.STUDIO_CURRENT, () => null);
  const loading = useState(STATE_KEYS.STUDIO_LOADING, () => false);

  async function searchStudios(query?: Record<string, string>) {
    loading.value = true;
    try {
      const { data, error } = await api.studios.get({ query: query || {} });
      if (error) throw new Error("Failed to search studios");
      studios.value = Array.isArray(data)
        ? data
            .map((entry) => toGameStudio(entry))
            .filter((entry): entry is GameStudio => entry !== null)
        : [];
    } finally {
      loading.value = false;
    }
  }

  async function getStudio(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.studios({ id }).get();
      if (error) throw new Error("Failed to fetch studio");
      const normalized = toGameStudio(data);
      if (!normalized) throw new Error("Invalid studio payload");
      currentStudio.value = normalized;
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function getAnalytics() {
    loading.value = true;
    try {
      const { data, error } = await api.studios.analytics.get();
      if (error) throw new Error("Failed to fetch studio analytics");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function createStudio(studioData: CreateStudioInput) {
    loading.value = true;
    try {
      const { data, error } = await api.studios.post(studioData);
      if (error) throw new Error("Failed to create studio");
      await searchStudios();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function updateStudio(id: string, updates: UpdateStudioInput) {
    loading.value = true;
    try {
      const { data, error } = await api.studios({ id }).put(updates);
      if (error) throw new Error("Failed to update studio");
      const normalized = toGameStudio(data);
      if (!normalized) throw new Error("Invalid studio payload");
      currentStudio.value = normalized;
      await searchStudios();
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function deleteStudio(id: string) {
    loading.value = true;
    try {
      const { error } = await api.studios({ id }).delete();
      if (error) throw new Error("Failed to delete studio");
      if (currentStudio.value?.id === id) {
        currentStudio.value = null;
      }
      await searchStudios();
    } finally {
      loading.value = false;
    }
  }

  return {
    studios: readonly(studios),
    studio: readonly(currentStudio),
    currentStudio: readonly(currentStudio),
    loading: readonly(loading),
    searchStudios,
    fetchStudios: searchStudios,
    getStudio,
    fetchStudioById: getStudio,
    getAnalytics,
    createStudio,
    updateStudio,
    deleteStudio,
  };
}
