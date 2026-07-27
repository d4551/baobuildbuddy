// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AppPagination from "./AppPagination.vue";

/** Props derived from the component itself — never re-declared here. */
type PaginationProps = InstanceType<typeof AppPagination>["$props"];

/** Selectors and props read these from one place so neither can drift. */
const PREVIOUS_ARIA = "Previous page";
const NEXT_ARIA = "Next page";

/** The three-page fixture every case is written against. */
const FIRST_PAGE = 1;
const MIDDLE_PAGE = 2;
const LAST_PAGE = 3;
const ALL_PAGES = [FIRST_PAGE, MIDDLE_PAGE, LAST_PAGE];
const TOTAL_PAGES = ALL_PAGES.length;

/** Zero-based positions within the rendered page-button list. */
const FIRST_BUTTON = 0;
const MIDDLE_BUTTON = 1;
const LAST_BUTTON = 2;

/** Values the normalizer must reject. */
const PAGE_JUST_PAST_TOTAL = 4;
const PAGE_FAR_PAST_TOTAL = 50;
const PAGE_ZERO = 0;
const PAGE_NEGATIVE = -1;
const PAGE_FRACTIONAL = 1.5;
const PAGE_UNREACHABLE = 99;

/** A pagination bar collapses entirely at this many pages. */
const ONLY_ONE_PAGE = 1;
const SINGLE_MATCH = 1;

const BASE: PaginationProps = {
  currentPage: FIRST_PAGE,
  totalPages: TOTAL_PAGES,
  pageNumbers: ALL_PAGES,
  summary: "Showing 1-12 of 24 jobs",
  navigationAria: "Job pages",
  previousAria: PREVIOUS_ARIA,
  nextAria: NEXT_ARIA,
  pageAria: (page: number) => `Page ${page}`,
};

const mountPagination = async (overrides: Partial<PaginationProps> = {}) =>
  await mountSuspended(AppPagination, { props: { ...BASE, ...overrides } });

/** Matches a button whose whole label is a page number. */
const PAGE_LABEL_PATTERN = /^\d+$/;

/** Page buttons only — excludes the previous/next controls. */
const pageButtons = (wrapper: Awaited<ReturnType<typeof mountPagination>>) =>
  wrapper.findAll("nav button").filter((b) => PAGE_LABEL_PATTERN.test(b.text().trim()));

const labelled = (wrapper: Awaited<ReturnType<typeof mountPagination>>, aria: string) =>
  wrapper.find(`nav button[aria-label="${aria}"]`);

describe("AppPagination visibility", () => {
  it("renders nothing when only one page exists", async () => {
    const wrapper = await mountPagination({
      totalPages: ONLY_ONE_PAGE,
      pageNumbers: [FIRST_PAGE],
    });

    expect(wrapper.find("nav").exists()).toBe(false);
  });

  it("renders nothing when no supplied page number is in range", async () => {
    const wrapper = await mountPagination({ pageNumbers: [PAGE_ZERO, PAGE_UNREACHABLE] });

    expect(wrapper.find("nav").exists()).toBe(false);
  });

  it("renders the navigation with its accessible name", async () => {
    const wrapper = await mountPagination();

    expect(wrapper.find("nav").attributes("aria-label")).toBe(BASE.navigationAria);
  });

  it("renders the caller-supplied summary", async () => {
    const wrapper = await mountPagination();

    expect(wrapper.text()).toContain(BASE.summary);
  });
});

describe("AppPagination page normalization", () => {
  it("drops pages beyond the total", async () => {
    const wrapper = await mountPagination({
      pageNumbers: [...ALL_PAGES, PAGE_JUST_PAST_TOTAL, PAGE_FAR_PAST_TOTAL],
    });

    expect(pageButtons(wrapper).map((b) => b.text())).toEqual(ALL_PAGES.map(String));
  });

  it("drops pages below one", async () => {
    const wrapper = await mountPagination({
      pageNumbers: [PAGE_NEGATIVE, PAGE_ZERO, FIRST_PAGE, MIDDLE_PAGE],
    });

    expect(pageButtons(wrapper).map((b) => b.text())).toEqual(
      [FIRST_PAGE, MIDDLE_PAGE].map(String),
    );
  });

  it("drops non-integer pages", async () => {
    const wrapper = await mountPagination({
      pageNumbers: [FIRST_PAGE, PAGE_FRACTIONAL, MIDDLE_PAGE],
    });

    expect(pageButtons(wrapper).map((b) => b.text())).toEqual(
      [FIRST_PAGE, MIDDLE_PAGE].map(String),
    );
  });

  it("collapses duplicate pages to one button", async () => {
    const wrapper = await mountPagination({
      pageNumbers: [FIRST_PAGE, FIRST_PAGE, MIDDLE_PAGE, MIDDLE_PAGE, LAST_PAGE],
    });

    expect(pageButtons(wrapper).map((b) => b.text())).toEqual(ALL_PAGES.map(String));
  });
});

describe("AppPagination current-page semantics", () => {
  it("marks only the current page with aria-current", async () => {
    const wrapper = await mountPagination({ currentPage: MIDDLE_PAGE });
    const marked = pageButtons(wrapper).filter((b) => b.attributes("aria-current") === "page");

    expect(marked).toHaveLength(SINGLE_MATCH);
    expect(marked[FIRST_BUTTON]?.text()).toBe(String(MIDDLE_PAGE));
  });

  it("keeps only the current page in the tab order", async () => {
    const wrapper = await mountPagination({ currentPage: MIDDLE_PAGE });
    const tabbable = pageButtons(wrapper).filter((b) => b.attributes("tabindex") === "0");

    expect(tabbable).toHaveLength(SINGLE_MATCH);
    expect(tabbable[FIRST_BUTTON]?.text()).toBe(String(MIDDLE_PAGE));
  });
});

describe("AppPagination boundary controls", () => {
  it("disables previous on the first page", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });

    expect(labelled(wrapper, PREVIOUS_ARIA).attributes("disabled")).toBeDefined();
  });

  it("enables next on the first page", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });

    expect(labelled(wrapper, NEXT_ARIA).attributes("disabled")).toBeUndefined();
  });

  it("disables next on the last page", async () => {
    const wrapper = await mountPagination({ currentPage: LAST_PAGE });

    expect(labelled(wrapper, NEXT_ARIA).attributes("disabled")).toBeDefined();
  });
});

describe("AppPagination selection", () => {
  it("emits the chosen page", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });
    await pageButtons(wrapper)[LAST_BUTTON]?.trigger("click");

    expect(wrapper.emitted("update:currentPage")?.at(-1)).toEqual([LAST_PAGE]);
  });

  it("does not re-emit when the current page is clicked", async () => {
    const wrapper = await mountPagination({ currentPage: MIDDLE_PAGE });
    await pageButtons(wrapper)[MIDDLE_BUTTON]?.trigger("click");

    expect(wrapper.emitted("update:currentPage")).toBeUndefined();
  });

  it("steps backwards from the previous control", async () => {
    const wrapper = await mountPagination({ currentPage: LAST_PAGE });
    await labelled(wrapper, PREVIOUS_ARIA).trigger("click");

    expect(wrapper.emitted("update:currentPage")?.at(-1)).toEqual([MIDDLE_PAGE]);
  });

  it("steps forwards from the next control", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });
    await labelled(wrapper, NEXT_ARIA).trigger("click");

    expect(wrapper.emitted("update:currentPage")?.at(-1)).toEqual([MIDDLE_PAGE]);
  });
});

describe("AppPagination keyboard navigation", () => {
  it("jumps to the first page on Home", async () => {
    const wrapper = await mountPagination({ currentPage: LAST_PAGE });
    await pageButtons(wrapper)[LAST_BUTTON]?.trigger("keydown", { key: "Home" });

    expect(wrapper.emitted("update:currentPage")?.at(-1)).toEqual([FIRST_PAGE]);
  });

  it("jumps to the last page on End", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });
    await pageButtons(wrapper)[FIRST_BUTTON]?.trigger("keydown", { key: "End" });

    expect(wrapper.emitted("update:currentPage")?.at(-1)).toEqual([LAST_PAGE]);
  });

  it("advances on ArrowRight", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });
    await pageButtons(wrapper)[FIRST_BUTTON]?.trigger("keydown", { key: "ArrowRight" });

    expect(wrapper.emitted("update:currentPage")?.at(-1)).toEqual([MIDDLE_PAGE]);
  });

  it("wraps to the last page when stepping left from the first", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });
    await pageButtons(wrapper)[FIRST_BUTTON]?.trigger("keydown", { key: "ArrowLeft" });

    expect(wrapper.emitted("update:currentPage")?.at(-1)).toEqual([LAST_PAGE]);
  });

  it("ignores keys it does not handle", async () => {
    const wrapper = await mountPagination({ currentPage: FIRST_PAGE });
    await pageButtons(wrapper)[FIRST_BUTTON]?.trigger("keydown", { key: "a" });

    expect(wrapper.emitted("update:currentPage")).toBeUndefined();
  });
});
