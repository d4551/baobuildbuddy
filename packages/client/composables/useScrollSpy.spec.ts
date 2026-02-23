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

beforeEach(() => {
  MockIntersectionObserver.latest = null;
  vi.restoreAllMocks();
  globalThis.IntersectionObserver = MockIntersectionObserver;
});

const hasDomEnvironment = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

describe("useScrollSpy", () => {
  it("syncs from hash and scrolls to registered section", () => {
    if (!hasDomEnvironment()) {
      return;
    }
    const scope = effectScope();
    const spy = vi.spyOn(window.history, "replaceState");
    const scrollSpy = scope.run(() => useScrollSpy());
    if (!scrollSpy) {
      throw new Error("Scroll spy did not initialize");
    }

    const section = document.createElement("section");
    section.id = "overview";
    section.scrollIntoView = vi.fn();
    section.focus = vi.fn();

    scrollSpy.setSectionRef("overview", section);
    const restored = scrollSpy.syncFromHash("#overview");

    expect(restored).toBe(true);
    expect(scrollSpy.activeSectionId.value).toBe("overview");
    expect(section.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(spy).not.toHaveBeenCalled();

    scope.stop();
  });

  it("updates active section from intersection observer events", () => {
    if (!hasDomEnvironment()) {
      return;
    }
    const scope = effectScope();
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const scrollSpy = scope.run(() => useScrollSpy());
    if (!scrollSpy) {
      throw new Error("Scroll spy did not initialize");
    }

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
  });
});
