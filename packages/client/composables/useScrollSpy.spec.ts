import { beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";
import { useScrollSpy } from "./useScrollSpy";

class MockIntersectionObserver implements IntersectionObserver {
  static latest: MockIntersectionObserver | null = null;

  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
  readonly disconnect = vi.fn((): void => undefined);
  readonly observe = vi.fn((target: Element): void => {
    this.targets.add(target);
  });
  readonly unobserve = vi.fn((target: Element): void => {
    this.targets.delete(target);
  });

  private readonly callback: IntersectionObserverCallback;
  private readonly targets = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [typeof options?.threshold === "number" ? options.threshold : 0];
    MockIntersectionObserver.latest = this;
  }

  trigger(entries: readonly IntersectionObserverEntry[]): void {
    this.callback([...entries], this);
  }
}

const createEntry = (target: Element, intersectionRatio: number): IntersectionObserverEntry => ({
  time: Date.now(),
  target,
  rootBounds: null,
  boundingClientRect: target.getBoundingClientRect(),
  intersectionRect: target.getBoundingClientRect(),
  isIntersecting: true,
  intersectionRatio,
});

const hasDomEnvironment = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

beforeEach(() => {
  MockIntersectionObserver.latest = null;
  vi.restoreAllMocks();
  globalThis.IntersectionObserver = MockIntersectionObserver;
});

function createScopedScrollSpy() {
  const scope = effectScope();
  const scrollSpy = scope.run(() => useScrollSpy());
  if (!scrollSpy) {
    throw new Error("Scroll spy did not initialize");
  }
  return { scope, scrollSpy };
}

function assertSyncsFromHash(): void {
  if (!hasDomEnvironment()) {
    return;
  }

  const { scope, scrollSpy } = createScopedScrollSpy();
  const replaceStateSpy = vi.spyOn(window.history, "replaceState");

  const section = document.createElement("section");
  section.id = "overview";
  const scrollIntoViewMock = vi.fn();
  const focusMock = vi.fn();
  section.scrollIntoView = scrollIntoViewMock;
  section.focus = focusMock;

  scrollSpy.setSectionRef("overview", section);
  const restored = scrollSpy.syncFromHash("#overview");

  expect(restored).toBe(true);
  expect(scrollSpy.activeSectionId.value).toBe("overview");
  expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  expect(focusMock).not.toHaveBeenCalled();
  expect(replaceStateSpy).not.toHaveBeenCalled();

  scope.stop();
}

function assertUpdatesActiveSectionFromObserver(): void {
  if (!hasDomEnvironment()) {
    return;
  }

  const { scope, scrollSpy } = createScopedScrollSpy();
  const replaceStateSpy = vi.spyOn(window.history, "replaceState");

  const sectionOne = document.createElement("section");
  sectionOne.id = "one";
  const sectionTwo = document.createElement("section");
  sectionTwo.id = "two";
  scrollSpy.setSectionRef("one", sectionOne);
  scrollSpy.setSectionRef("two", sectionTwo);

  scrollSpy.startObserver();
  const observer = MockIntersectionObserver.latest;
  if (!observer) {
    throw new Error("Observer was not created");
  }

  observer.trigger([createEntry(sectionOne, 0.3), createEntry(sectionTwo, 0.8)]);

  expect(scrollSpy.activeSectionId.value).toBe("two");
  expect(replaceStateSpy).toHaveBeenCalledWith({}, "", "#two");

  scope.stop();
}

function assertDoesNotDuplicateHashUpdates(): void {
  if (!hasDomEnvironment()) {
    return;
  }

  const { scope, scrollSpy } = createScopedScrollSpy();
  const replaceStateSpy = vi.spyOn(window.history, "replaceState");

  const section = document.createElement("section");
  section.id = "same";
  section.scrollIntoView = vi.fn();
  section.focus = vi.fn();
  scrollSpy.setSectionRef("same", section);

  scrollSpy.scrollToSection("same", { smooth: false, focus: false, updateHash: true });
  scrollSpy.scrollToSection("same", { smooth: false, focus: false, updateHash: true });

  expect(replaceStateSpy).toHaveBeenCalledTimes(1);

  scope.stop();
}

describe("useScrollSpy", () => {
  it("syncs from hash and scrolls to registered section", assertSyncsFromHash);
  it(
    "updates active section from intersection observer events",
    assertUpdatesActiveSectionFromObserver,
  );
  it(
    "does not duplicate hash updates when the active section is unchanged",
    assertDoesNotDuplicateHashUpdates,
  );
});
