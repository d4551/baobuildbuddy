// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { LOADING_SKELETON_LINES } from "~/constants/numeric-ui";
import LoadingSkeleton from "./LoadingSkeleton.vue";

/** Props derived from the component itself — never re-declared here. */
type LoadingSkeletonProps = Partial<InstanceType<typeof LoadingSkeleton>["$props"]>;

const CUSTOM_LINE_COUNT = LOADING_SKELETON_LINES.long;
const CUSTOM_LABEL = "Loading saved jobs";

const mountSkeleton = async (props: LoadingSkeletonProps = {}) =>
  await mountSuspended(LoadingSkeleton, { props });

const statusRegion = async (props: LoadingSkeletonProps = {}) => {
  const wrapper = await mountSkeleton(props);
  return wrapper.find('[role="status"]');
};

describe("LoadingSkeleton busy region semantics", () => {
  it("exposes the text variant as a polite busy status region", async () => {
    const region = await statusRegion();

    expect(region.exists()).toBe(true);
    expect(region.attributes("aria-live")).toBe("polite");
    expect(region.attributes("aria-busy")).toBe("true");
  });

  it("exposes the cards variant as a polite busy status region", async () => {
    const region = await statusRegion({ variant: "cards" });

    expect(region.exists()).toBe(true);
    expect(region.attributes("aria-live")).toBe("polite");
    expect(region.attributes("aria-busy")).toBe("true");
  });

  it("exposes the stats variant as a polite busy status region", async () => {
    const region = await statusRegion({ variant: "stats" });

    expect(region.exists()).toBe(true);
    expect(region.attributes("aria-live")).toBe("polite");
    expect(region.attributes("aria-busy")).toBe("true");
  });
});

describe("LoadingSkeleton accessible name", () => {
  it("names the text variant even when the caller passes no label", async () => {
    const wrapper = await mountSkeleton();

    expect(wrapper.find(".sr-only").text().trim().length).toBeGreaterThan(0);
  });

  it("names the cards variant even when the caller passes no label", async () => {
    const wrapper = await mountSkeleton({ variant: "cards" });

    expect(wrapper.find(".sr-only").text().trim().length).toBeGreaterThan(0);
  });

  it("names the stats variant even when the caller passes no label", async () => {
    const wrapper = await mountSkeleton({ variant: "stats" });

    expect(wrapper.find(".sr-only").text().trim().length).toBeGreaterThan(0);
  });

  it("prefers a caller-supplied label over the default", async () => {
    const wrapper = await mountSkeleton({ label: CUSTOM_LABEL });

    expect(wrapper.find(".sr-only").text()).toBe(CUSTOM_LABEL);
  });
});

describe("LoadingSkeleton text variant shape", () => {
  it("renders one skeleton bar per requested line", async () => {
    const wrapper = await mountSkeleton({ lines: CUSTOM_LINE_COUNT });

    expect(wrapper.findAll(".skeleton")).toHaveLength(CUSTOM_LINE_COUNT);
  });

  it("applies the caller width to every bar except the last", async () => {
    const wrapper = await mountSkeleton({ lines: CUSTOM_LINE_COUNT, width: "w-1/2" });
    const bars = wrapper.findAll(".skeleton");

    expect(bars[0]?.classes()).toContain("w-1/2");
    expect(bars[bars.length - 1]?.classes()).toContain("w-3/4");
  });

  it("renders a distinct structure for the cards variant", async () => {
    const wrapper = await mountSkeleton({ variant: "cards" });

    expect(wrapper.findAll(".card-body").length).toBeGreaterThan(0);
  });

  it("renders a distinct structure for the stats variant", async () => {
    const wrapper = await mountSkeleton({ variant: "stats" });

    expect(wrapper.findAll(".stat").length).toBeGreaterThan(0);
  });
});
