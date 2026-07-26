import { AI_CHAT_ROUTE_QUERY_KEYS } from "@bao/shared/constants/ai-chat";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { queryValueToString } from "~/utils/route-query";

/**
 * Resolves the studio referenced by `?studio=<id>` into the shared current-studio
 * state.
 *
 * Only the studio detail page used to populate that state, so any other surface
 * reached with a studio in the route (AI chat, resume, cover letter, interview)
 * had an id but no studio record. The AI context then fell back to rendering the
 * raw slug — "riot-games" instead of "Riot Games" — in user-facing copy, and any
 * tailoring that needs studio attributes (culture, tech stack, interview process)
 * had nothing to read.
 */
export const useRouteStudioContext = (): void => {
  const route = useRoute();
  const { t } = useI18n();
  const { currentStudio, getStudio } = useStudio();

  const routeStudioId = computed(() =>
    queryValueToString(route.query[AI_CHAT_ROUTE_QUERY_KEYS.studioId]).trim(),
  );

  const hydrateRouteStudio = (studioId: string): void => {
    if (studioId.length === 0 || currentStudio.value?.id === studioId) {
      return;
    }
    // Fire-and-settle: a missing or deleted studio leaves the context on the id,
    // which the surfaces already render, so it must not break the page.
    settlePromise(getStudio(studioId), t("apiErrors.studios.fetchFailed")).then(
      () => undefined,
      () => undefined,
    );
  };

  watch(routeStudioId, hydrateRouteStudio, { immediate: true });
};
