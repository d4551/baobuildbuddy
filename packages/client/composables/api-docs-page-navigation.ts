import { computed, nextTick, onBeforeUnmount, watch } from "vue";
import type { ComponentPublicInstance, Ref } from "vue";
import type { ApiDocsUiState, ApiEndpointGroup } from "~/types/api-docs";
import { useScrollSpy } from "~/composables/useScrollSpy";

interface ApiDocsPageNavigationOptions {
  readonly route: { readonly hash: string };
  readonly docsUiState: Readonly<Ref<ApiDocsUiState>>;
  readonly endpointGroups: Readonly<Ref<readonly ApiEndpointGroup[]>>;
}

const createActiveEndpointId = (
  activeSectionId: Readonly<Ref<string | undefined>>,
  endpointGroups: Readonly<Ref<readonly ApiEndpointGroup[]>>,
) =>
  computed(() => {
    if (activeSectionId.value && activeSectionId.value.length > 0) {
      return activeSectionId.value;
    }
    const firstGroup = endpointGroups.value[0];
    return firstGroup?.endpoints[0]?.id ?? "";
  });

const syncScrollSpyFromHash = (
  routeHash: string,
  endpointGroups: Readonly<Ref<readonly ApiEndpointGroup[]>>,
  syncFromHash: (hash: string) => boolean,
  scrollToSection: ReturnType<typeof useScrollSpy>["scrollToSection"],
): void => {
  if (!syncFromHash(routeHash)) {
    const firstEndpointId = endpointGroups.value[0]?.endpoints[0]?.id;
    if (firstEndpointId) {
      scrollToSection(firstEndpointId, {
        smooth: false,
        focus: false,
        updateHash: false,
      });
    }
  }
};

const createScrollToEndpoint =
  (scrollToSection: ReturnType<typeof useScrollSpy>["scrollToSection"]) =>
  (sectionId: string): void => {
    scrollToSection(sectionId, {
      smooth: true,
      focus: true,
      updateHash: true,
    });
  };

const createEndpointSectionRegistrar =
  (setSectionRef: ReturnType<typeof useScrollSpy>["setSectionRef"]) =>
  (endpointId: string) =>
  (element: Element | ComponentPublicInstance | null) => {
    setSectionRef(endpointId, element instanceof Element ? element : null);
  };

const registerApiDocsNavigationEffects = (input: {
  readonly docsUiState: Readonly<Ref<ApiDocsUiState>>;
  readonly endpointGroups: Readonly<Ref<readonly ApiEndpointGroup[]>>;
  readonly route: { readonly hash: string };
  readonly syncFromHash: ReturnType<typeof useScrollSpy>["syncFromHash"];
  readonly startObserver: ReturnType<typeof useScrollSpy>["startObserver"];
  readonly refreshObserver: ReturnType<typeof useScrollSpy>["refreshObserver"];
  readonly stopObserver: ReturnType<typeof useScrollSpy>["stopObserver"];
  readonly scrollToSection: ReturnType<typeof useScrollSpy>["scrollToSection"];
}) => {
  watch(
    [input.docsUiState, input.endpointGroups],
    async ([stateValue]) => {
      if (stateValue !== "success") {
        input.stopObserver();
        return;
      }

      await nextTick();
      input.startObserver();
      input.refreshObserver();
      syncScrollSpyFromHash(
        input.route.hash,
        input.endpointGroups,
        input.syncFromHash,
        input.scrollToSection,
      );
    },
    { immediate: true },
  );

  watch(
    () => input.route.hash,
    (nextHash) => {
      if (input.docsUiState.value !== "success") {
        return;
      }
      input.syncFromHash(nextHash);
    },
  );

  onBeforeUnmount(() => {
    input.stopObserver();
  });
};

export const useApiDocsPageNavigation = ({
  route,
  docsUiState,
  endpointGroups,
}: ApiDocsPageNavigationOptions) => {
  const scrollSpy = useScrollSpy();
  registerApiDocsNavigationEffects({
    docsUiState,
    endpointGroups,
    route,
    syncFromHash: scrollSpy.syncFromHash,
    startObserver: scrollSpy.startObserver,
    refreshObserver: scrollSpy.refreshObserver,
    stopObserver: scrollSpy.stopObserver,
    scrollToSection: scrollSpy.scrollToSection,
  });

  return {
    activeEndpointId: createActiveEndpointId(scrollSpy.activeSectionId, endpointGroups),
    scrollToEndpoint: createScrollToEndpoint(scrollSpy.scrollToSection),
    registerEndpointSectionRef: createEndpointSectionRegistrar(scrollSpy.setSectionRef),
  };
};
