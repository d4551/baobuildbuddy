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

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const normalizeHashValue = (value: string, hashPrefix: string): string =>
  value.replace(new RegExp(`^${escapeRegExp(hashPrefix)}`, "u"), "").trim();

/**
 * Generic section-based scroll spy composable with deterministic active-id updates.
 */
export function useScrollSpy(options: ScrollSpyOptions = {}) {
  const activeSectionId = ref<string>("");
  const sectionNodes = new Map<string, HTMLElement>();
  const observer = ref<IntersectionObserver | null>(null);
  const hashPrefix = options.hashPrefix ?? DEFAULT_HASH_PREFIX;
  let lastManualScrollAt = 0;

  const updateActiveSection = (sectionId: string, updateHash: boolean): void => {
    if (sectionId.length === 0 || activeSectionId.value === sectionId) {
      return;
    }
    activeSectionId.value = sectionId;
    if (!updateHash || typeof window === "undefined") {
      return;
    }
    const nextHash = `${hashPrefix}${sectionId}`;
    if (window.location.hash === nextHash) {
      return;
    }
    window.history.replaceState({}, "", nextHash);
  };

  const resolveFallbackSectionId = (): string | null => {
    const firstSection = sectionNodes.values().next().value;
    if (!firstSection) {
      return null;
    }
    return firstSection.id || null;
  };

  const sectionObserverCallback: IntersectionObserverCallback = (entries) => {
    if (typeof window !== "undefined") {
      const elapsedMs = Date.now() - lastManualScrollAt;
      if (elapsedMs < MANUAL_SCROLL_LOCK_MS) {
        return;
      }
    }

    const nextEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => {
        const ratioCompare = b.intersectionRatio - a.intersectionRatio;
        if (ratioCompare !== 0) {
          return ratioCompare;
        }
        return a.boundingClientRect.top - b.boundingClientRect.top;
      })[0];

    const nextId = nextEntry?.target.id || resolveFallbackSectionId();
    if (!nextId) {
      return;
    }
    updateActiveSection(nextId, true);
  };

  const refreshObserver = (): void => {
    const activeObserver = observer.value;
    if (!activeObserver) {
      return;
    }
    activeObserver.disconnect();
    for (const section of sectionNodes.values()) {
      activeObserver.observe(section);
    }
  };

  const startObserver = (): void => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return;
    }
    if (!observer.value) {
      observer.value = new IntersectionObserver(sectionObserverCallback, {
        root: null,
        threshold: options.threshold ?? DEFAULT_THRESHOLD,
        rootMargin: options.rootMargin ?? DEFAULT_ROOT_MARGIN,
      });
    }
    refreshObserver();
  };

  const stopObserver = (): void => {
    observer.value?.disconnect();
    observer.value = null;
  };

  /**
   * Registers/unregisters a section node by id.
   */
  const setSectionRef = (sectionId: string, element: Element | null): void => {
    const previous = sectionNodes.get(sectionId);
    if (previous && observer.value) {
      observer.value.unobserve(previous);
    }

    if (!element) {
      sectionNodes.delete(sectionId);
      if (activeSectionId.value === sectionId) {
        const fallbackId = resolveFallbackSectionId() ?? "";
        activeSectionId.value = fallbackId;
      }
      return;
    }
    if (element instanceof HTMLElement) {
      sectionNodes.set(sectionId, element);
      if (observer.value) {
        observer.value.observe(element);
      }
    }
  };

  /**
   * Scrolls to a registered section and updates active hash state.
   */
  const scrollToSection = (
    sectionId: string,
    optionsValue: {
      smooth?: boolean;
      focus?: boolean;
      updateHash?: boolean;
    } = {},
  ): void => {
    const section = sectionNodes.get(sectionId);
    if (!section) {
      return;
    }

    const smooth = optionsValue.smooth ?? true;
    const focus = optionsValue.focus ?? true;
    const updateHash = optionsValue.updateHash ?? true;

    lastManualScrollAt = Date.now();
    updateActiveSection(sectionId, updateHash);
    section.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "start",
    });
    if (focus) {
      section.focus({ preventScroll: true });
    }
  };

  /**
   * Restores active section based on URL hash when available.
   */
  const syncFromHash = (hashValue: string): boolean => {
    const normalizedHash = normalizeHashValue(hashValue, hashPrefix);
    if (!(normalizedHash && sectionNodes.has(normalizedHash))) {
      return false;
    }
    scrollToSection(normalizedHash, {
      smooth: false,
      focus: false,
      updateHash: false,
    });
    return true;
  };

  if (getCurrentScope()) {
    onScopeDispose(stopObserver);
  }

  return {
    activeSectionId: readonly(activeSectionId),
    setSectionRef,
    scrollToSection,
    syncFromHash,
    startObserver,
    refreshObserver,
    stopObserver,
  };
}
