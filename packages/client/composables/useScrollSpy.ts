import { escapeRegExp } from "@bao/shared/utils/string";
import { getCurrentScope, onScopeDispose, readonly, ref } from "vue";

type ScrollSpyOptions = {
  rootMargin?: string;
  threshold?: number[];
  hashPrefix?: string;
};

const DEFAULT_HASH_PREFIX = "#";
const DEFAULT_ROOT_MARGIN = "-20% 0px -60% 0px";
const DEFAULT_THRESHOLD = [0.1, 0.3, 0.5, 0.8];
const MANUAL_SCROLL_LOCK_MS = 250;
const normalizeHashValue = (value: string, hashPrefix: string): string =>
  value.replace(new RegExp(`^${escapeRegExp(hashPrefix)}`, "u"), "").trim();

interface ScrollSpyState {
  activeSectionId: ReturnType<typeof ref<string>>;
  sectionNodes: Map<string, HTMLElement>;
  observer: ReturnType<typeof ref<IntersectionObserver | null>>;
  hashPrefix: string;
  lastManualScrollAt: number;
}

function createScrollSpyState(options: ScrollSpyOptions): ScrollSpyState {
  return {
    activeSectionId: ref(""),
    sectionNodes: new Map<string, HTMLElement>(),
    observer: ref<IntersectionObserver | null>(null),
    hashPrefix: options.hashPrefix ?? DEFAULT_HASH_PREFIX,
    lastManualScrollAt: 0,
  };
}

function resolveFallbackSectionId(state: ScrollSpyState): string | null {
  const firstSection = state.sectionNodes.values().next().value;
  return firstSection?.id || null;
}

function updateActiveSection(state: ScrollSpyState, sectionId: string, updateHash: boolean): void {
  if (sectionId.length === 0 || state.activeSectionId.value === sectionId) {
    return;
  }

  state.activeSectionId.value = sectionId;
  if (!updateHash || typeof window === "undefined") {
    return;
  }

  const nextHash = `${state.hashPrefix}${sectionId}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState({}, "", nextHash);
  }
}

function shouldIgnoreObserverTick(state: ScrollSpyState): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return Date.now() - state.lastManualScrollAt < MANUAL_SCROLL_LOCK_MS;
}

function pickEntryId(
  state: ScrollSpyState,
  entries: readonly IntersectionObserverEntry[],
): string | null {
  const nextEntry = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => {
      const ratioCompare = b.intersectionRatio - a.intersectionRatio;
      if (ratioCompare !== 0) {
        return ratioCompare;
      }
      return a.boundingClientRect.top - b.boundingClientRect.top;
    })[0];

  return nextEntry?.target.id || resolveFallbackSectionId(state);
}

function createObserverCallback(state: ScrollSpyState): IntersectionObserverCallback {
  return (entries) => {
    if (shouldIgnoreObserverTick(state)) {
      return;
    }

    const nextId = pickEntryId(state, entries);
    if (nextId) {
      updateActiveSection(state, nextId, true);
    }
  };
}

function refreshObserver(state: ScrollSpyState): void {
  const activeObserver = state.observer.value;
  if (!activeObserver) {
    return;
  }

  activeObserver.disconnect();
  for (const section of state.sectionNodes.values()) {
    activeObserver.observe(section);
  }
}

function startObserver(state: ScrollSpyState, options: ScrollSpyOptions): void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return;
  }

  if (!state.observer.value) {
    state.observer.value = new IntersectionObserver(createObserverCallback(state), {
      root: null,
      threshold: options.threshold ?? DEFAULT_THRESHOLD,
      rootMargin: options.rootMargin ?? DEFAULT_ROOT_MARGIN,
    });
  }

  refreshObserver(state);
}

function stopObserver(state: ScrollSpyState): void {
  state.observer.value?.disconnect();
  state.observer.value = null;
}

function setSectionRef(state: ScrollSpyState, sectionId: string, element: Element | null): void {
  const previous = state.sectionNodes.get(sectionId);
  if (previous && state.observer.value) {
    state.observer.value.unobserve(previous);
  }

  if (!element) {
    state.sectionNodes.delete(sectionId);
    if (state.activeSectionId.value === sectionId) {
      state.activeSectionId.value = resolveFallbackSectionId(state) ?? "";
    }
    return;
  }

  if (element instanceof HTMLElement) {
    state.sectionNodes.set(sectionId, element);
    state.observer.value?.observe(element);
  }
}

function scrollToSection(
  state: ScrollSpyState,
  sectionId: string,
  optionsValue: {
    smooth?: boolean;
    focus?: boolean;
    updateHash?: boolean;
  } = {},
): void {
  const section = state.sectionNodes.get(sectionId);
  if (!section) {
    return;
  }

  const smooth = optionsValue.smooth ?? true;
  const focus = optionsValue.focus ?? true;
  const updateHash = optionsValue.updateHash ?? true;

  state.lastManualScrollAt = Date.now();
  updateActiveSection(state, sectionId, updateHash);
  section.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "start",
  });
  if (focus) {
    section.focus({ preventScroll: true });
  }
}

function syncFromHash(state: ScrollSpyState, hashValue: string): boolean {
  const normalizedHash = normalizeHashValue(hashValue, state.hashPrefix);
  if (!(normalizedHash && state.sectionNodes.has(normalizedHash))) {
    return false;
  }

  scrollToSection(state, normalizedHash, {
    smooth: false,
    focus: false,
    updateHash: false,
  });
  return true;
}

/**
 * Generic section-based scroll spy composable with deterministic active-id updates.
 */
export function useScrollSpy(options: ScrollSpyOptions = {}) {
  const state = createScrollSpyState(options);
  const stop = (): void => stopObserver(state);
  if (getCurrentScope()) {
    onScopeDispose(stop);
  }

  return {
    activeSectionId: readonly(state.activeSectionId),
    setSectionRef: (sectionId: string, element: Element | null) =>
      setSectionRef(state, sectionId, element),
    scrollToSection: (
      sectionId: string,
      optionsValue: {
        smooth?: boolean;
        focus?: boolean;
        updateHash?: boolean;
      } = {},
    ) => scrollToSection(state, sectionId, optionsValue),
    syncFromHash: (hashValue: string) => syncFromHash(state, hashValue),
    startObserver: () => startObserver(state, options),
    refreshObserver: () => refreshObserver(state),
    stopObserver: stop,
  };
}
