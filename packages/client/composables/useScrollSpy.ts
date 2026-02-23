import { onBeforeUnmount, readonly, ref } from "vue";

type ScrollSpyOptions = {
  rootMargin?: string;
  threshold?: number[];
  hashPrefix?: string;
};

const DEFAULT_HASH_PREFIX = "#";
const DEFAULT_ROOT_MARGIN = "-20% 0px -60% 0px";
const DEFAULT_THRESHOLD = [0.1, 0.3, 0.5, 0.8];

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

  const sectionObserverCallback: IntersectionObserverCallback = (entries) => {
    const nextEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => {
        const ratioCompare = b.intersectionRatio - a.intersectionRatio;
        if (ratioCompare !== 0) {
          return ratioCompare;
        }
        return a.boundingClientRect.top - b.boundingClientRect.top;
      })[0];

    if (!nextEntry?.target.id) {
      return;
    }

    activeSectionId.value = nextEntry.target.id;
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `${hashPrefix}${nextEntry.target.id}`);
    }
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
    if (!element) {
      sectionNodes.delete(sectionId);
      return;
    }
    if (element instanceof HTMLElement) {
      sectionNodes.set(sectionId, element);
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

    activeSectionId.value = sectionId;
    section.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "start",
    });

    if (updateHash && typeof window !== "undefined") {
      window.history.replaceState({}, "", `${hashPrefix}${sectionId}`);
    }
    if (focus) {
      section.focus({ preventScroll: true });
    }
  };

  /**
   * Restores active section based on URL hash when available.
   */
  const syncFromHash = (hashValue: string): boolean => {
    const normalizedHash = normalizeHashValue(hashValue, hashPrefix);
    if (!normalizedHash || !sectionNodes.has(normalizedHash)) {
      return false;
    }
    scrollToSection(normalizedHash, {
      smooth: false,
      focus: false,
      updateHash: false,
    });
    return true;
  };

  onBeforeUnmount(() => {
    stopObserver();
  });

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
