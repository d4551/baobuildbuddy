import type { GameStudio } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { toGameStudio } from "./api-normalizers";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";

type ApiClient = ReturnType<typeof useApi>;
type CreateStudioInput = NonNullable<Parameters<ApiClient["studios"]["post"]>[0]>;
type StudioRoute = ReturnType<ApiClient["studios"]>;
type UpdateStudioInput = NonNullable<Parameters<StudioRoute["put"]>[0]>;

interface StudioContext {
  api: ApiClient;
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
  studios: ReturnType<typeof useState<GameStudio[]>>;
  currentStudio: ReturnType<typeof useState<GameStudio | null>>;
}

const toStudioList = (value: unknown): GameStudio[] =>
  Array.isArray(value)
    ? value
        .map((entry) => toGameStudio(entry))
        .filter((entry): entry is GameStudio => entry !== null)
    : [];

function createReadStudioActions(context: StudioContext) {
  const searchStudios = async (query?: Record<string, string>) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.studios.get({ query: query || {} });
      assertApiResponse(error, context.t("apiErrors.studios.searchFailed"));
      context.studios.value = toStudioList(data);
    });

  const getStudio = async (id: string) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.studios({ id }).get();
      assertApiResponse(error, context.t("apiErrors.studios.fetchFailed"));
      const normalized = requireValue(
        toGameStudio(data),
        context.t("apiErrors.studios.invalidPayload"),
      );
      context.currentStudio.value = normalized;
      return normalized;
    });

  const getAnalytics = async () =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.studios.analytics.get();
      assertApiResponse(error, context.t("apiErrors.studios.fetchAnalyticsFailed"));
      return data;
    });

  return {
    searchStudios,
    getStudio,
    getAnalytics,
  };
}

function createWriteStudioActions(
  context: StudioContext,
  searchStudios: (query?: Record<string, string>) => Promise<void>,
) {
  const createStudio = async (studioData: CreateStudioInput) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.studios.post(studioData);
      assertApiResponse(error, context.t("apiErrors.studios.createFailed"));
      await searchStudios();
      return data;
    });

  const updateStudio = async (id: string, updates: UpdateStudioInput) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.studios({ id }).put(updates);
      assertApiResponse(error, context.t("apiErrors.studios.updateFailed"));
      const normalized = requireValue(
        toGameStudio(data),
        context.t("apiErrors.studios.invalidPayload"),
      );
      context.currentStudio.value = normalized;
      await searchStudios();
      return normalized;
    });

  const deleteStudio = async (id: string) =>
    withLoadingState(context.loading, async () => {
      const { error } = await context.api.studios({ id }).delete();
      assertApiResponse(error, context.t("apiErrors.studios.deleteFailed"));
      if (context.currentStudio.value?.id === id) {
        context.currentStudio.value = null;
      }
      await searchStudios();
    });

  return {
    createStudio,
    updateStudio,
    deleteStudio,
  };
}

/**
 * Interview studio discovery and analytics composable.
 */
export function useStudio() {
  const context: StudioContext = {
    api: useApi(),
    t: useI18n().t,
    studios: useState<GameStudio[]>(STATE_KEYS.STUDIOS_LIST, () => []),
    currentStudio: useState<GameStudio | null>(STATE_KEYS.STUDIO_CURRENT, () => null),
    loading: useState(STATE_KEYS.STUDIO_LOADING, () => false),
  };

  const readActions = createReadStudioActions(context);
  const writeActions = createWriteStudioActions(context, readActions.searchStudios);

  return {
    studios: readonly(context.studios),
    studio: readonly(context.currentStudio),
    currentStudio: readonly(context.currentStudio),
    loading: readonly(context.loading),
    searchStudios: readActions.searchStudios,
    fetchStudios: readActions.searchStudios,
    getStudio: readActions.getStudio,
    fetchStudioById: readActions.getStudio,
    getAnalytics: readActions.getAnalytics,
    createStudio: writeActions.createStudio,
    updateStudio: writeActions.updateStudio,
    deleteStudio: writeActions.deleteStudio,
  };
}
