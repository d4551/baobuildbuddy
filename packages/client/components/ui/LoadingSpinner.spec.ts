// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import LoadingSpinner from "./LoadingSpinner.vue";

/** Props derived from the component itself — never re-declared here. */
type LoadingSpinnerProps = Partial<InstanceType<typeof LoadingSpinner>["$props"]>;

const SPINNER_LABEL = "Loading saved jobs";

const mountSpinner = async (props: LoadingSpinnerProps = {}) =>
  await mountSuspended(LoadingSpinner, { props: { label: SPINNER_LABEL, ...props } });

describe("LoadingSpinner status semantics", () => {
  it("exposes a status role", async () => {
    const wrapper = await mountSpinner();

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it("carries the caller-supplied accessible name", async () => {
    const wrapper = await mountSpinner();

    expect(wrapper.attributes("aria-label")).toBe(SPINNER_LABEL);
  });

  it("never renders an unnamed status region", async () => {
    const wrapper = await mountSpinner();
    const label = wrapper.attributes("aria-label") ?? "";

    expect(label.trim().length).toBeGreaterThan(0);
  });
});

describe("LoadingSpinner sizing", () => {
  it("defaults to the small size token", async () => {
    const wrapper = await mountSpinner();

    expect(wrapper.classes()).toContain("loading-sm");
  });

  it("always carries the base spinner tokens", async () => {
    const wrapper = await mountSpinner();

    expect(wrapper.classes()).toEqual(expect.arrayContaining(["loading", "loading-spinner"]));
  });

  it("maps the extra-small size to its own token", async () => {
    const wrapper = await mountSpinner({ size: "xs" });

    expect(wrapper.classes()).toContain("loading-xs");
  });

  it("maps the medium size to its own token", async () => {
    const wrapper = await mountSpinner({ size: "md" });

    expect(wrapper.classes()).toContain("loading-md");
  });

  it("maps the large size to its own token", async () => {
    const wrapper = await mountSpinner({ size: "lg" });

    expect(wrapper.classes()).toContain("loading-lg");
  });
});
