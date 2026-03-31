import { API_ENDPOINTS, buildStudioDetailEndpoint } from "@bao/shared/constants/endpoints";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { GameStudio } from "@bao/shared/types/interview";
import { isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import {
  requestApi,
  useClientApiRequestRuntime,
  type ClientApiRequestRuntime,
} from "./api-request";
import { toGameStudio } from "./api-normalizer-studios";
import { requireValue, withLoadingState } from "./async-flow";

interface StudioContext {
  t: ReturnType<typeof useI18n>["t"];
  runtime: ClientApiRequestRuntime;
  loading: ReturnType<typeof useState<boolean>>;
  studios: ReturnType<typeof useState<GameStudio[]>>;
  currentStudio: ReturnType<typeof useState<GameStudio | null>>;
}

type CreateStudioInput = {
  [key: string]: unknown;
};
type UpdateStudioInput = {
  [key: string]: unknown;
};

const toStudioList = (value: unknown): GameStudio[] =>
  Array.isArray(value)
    ? value
        .map((entry) => toGameStudio(entry))
        .filter((entry): entry is GameStudio => entry !== null)
    : [];

const readApiData = async (
  request: Promise<unknown>,
  fallbackMessage: string,
): Promise<unknown> => {
  const response = await request;
  if (!isRecord(response)) {
    throw new Error(fallbackMessage);
  }
  if ("error" in response && response.error) {
    throw new Error(fallbackMessage);
  }
  return "data" in response ? response.data : undefined;
};

function createReadStudioActions(context: StudioContext) {
  const searchStudios = async (query?: Record<string, string>) =>
    withLoadingState(context.loading, async () => {
      const data = await readApiData(
        requestApi<unknown>(context.runtime, API_ENDPOINTS.studios, {
          method: "GET",
          query: query || {},
        }),
        context.t("apiErrors.studios.searchFailed"),
      );
      context.studios.value = toStudioList(data);
    });

  const getStudio = async (id: string) =>
    withLoadingState(context.loading, async () => {
      const data = await readApiData(
        requestApi<unknown>(context.runtime, buildStudioDetailEndpoint(id), {
          method: "GET",
        }),
        context.t("apiErrors.studios.fetchFailed"),
      );
      const normalized = requireValue(
        toGameStudio(data),
        context.t("apiErrors.studios.invalidPayload"),
      );
      context.currentStudio.value = normalized;
      return normalized;
    });

  const getAnalytics = async () =>
    withLoadingState(context.loading, async () => {
      const data = await readApiData(
        requestApi<unknown>(context.runtime, API_ENDPOINTS.studiosAnalytics, {
          method: "GET",
        }),
        context.t("apiErrors.studios.fetchAnalyticsFailed"),
      );
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
      const data = await readApiData(
        requestApi<unknown>(context.runtime, API_ENDPOINTS.studios, {
          method: "POST",
          body: studioData,
        }),
        context.t("apiErrors.studios.createFailed"),
      );
      const normalized = requireValue(
        toGameStudio(data),
        context.t("apiErrors.studios.invalidPayload"),
      );
      await searchStudios();
      return normalized;
    });

  const updateStudio = async (id: string, updates: UpdateStudioInput) =>
    withLoadingState(context.loading, async () => {
      const data = await readApiData(
        requestApi<unknown>(context.runtime, buildStudioDetailEndpoint(id), {
          method: "PUT",
          body: updates,
        }),
        context.t("apiErrors.studios.updateFailed"),
      );
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
      await readApiData(
        requestApi<unknown>(context.runtime, buildStudioDetailEndpoint(id), {
          method: "DELETE",
        }),
        context.t("apiErrors.studios.deleteFailed"),
      );
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
    t: useI18n().t,
    runtime: useClientApiRequestRuntime(),
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
