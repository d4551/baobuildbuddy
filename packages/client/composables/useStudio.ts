import type { GameStudio } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { toGameStudio } from "./api-normalizers";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";

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
    return withLoadingState(loading, async () => {
      const { data, error } = await api.studios.get({ query: query || {} });
      assertApiResponse(error, "Failed to search studios");
      studios.value = Array.isArray(data)
        ? data
            .map((entry) => toGameStudio(entry))
            .filter((entry): entry is GameStudio => entry !== null)
        : [];
    });
  }

  async function getStudio(id: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.studios({ id }).get();
      assertApiResponse(error, "Failed to fetch studio");
      const normalized = requireValue(toGameStudio(data), "Invalid studio payload");
      currentStudio.value = normalized;
      return normalized;
    });
  }

  async function getAnalytics() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.studios.analytics.get();
      assertApiResponse(error, "Failed to fetch studio analytics");
      return data;
    });
  }

  async function createStudio(studioData: CreateStudioInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.studios.post(studioData);
      assertApiResponse(error, "Failed to create studio");
      await searchStudios();
      return data;
    });
  }

  async function updateStudio(id: string, updates: UpdateStudioInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.studios({ id }).put(updates);
      assertApiResponse(error, "Failed to update studio");
      const normalized = requireValue(toGameStudio(data), "Invalid studio payload");
      currentStudio.value = normalized;
      await searchStudios();
      return normalized;
    });
  }

  async function deleteStudio(id: string) {
    return withLoadingState(loading, async () => {
      const { error } = await api.studios({ id }).delete();
      assertApiResponse(error, "Failed to delete studio");
      if (currentStudio.value?.id === id) {
        currentStudio.value = null;
      }
      await searchStudios();
    });
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
