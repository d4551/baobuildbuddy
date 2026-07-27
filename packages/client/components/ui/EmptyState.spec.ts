// @vitest-environment nuxt
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState.vue";

/** Props derived from the component itself — never re-declared here. */
type EmptyStateProps = Partial<InstanceType<typeof EmptyState>["$props"]>;

const TITLE_KEY = "jobs.empty.title";
const DESCRIPTION_KEY = "jobs.empty.description";
const CTA_LABEL_KEY = "jobs.empty.cta";
const CTA_ARIA_KEY = "jobs.empty.ctaAria";

const mountEmptyState = async (props: EmptyStateProps = {}) =>
  await mountSuspended(EmptyState, {
    props: { titleKey: TITLE_KEY, descriptionKey: DESCRIPTION_KEY, ...props },
  });

describe("EmptyState content", () => {
  it("renders the translated title and description", async () => {
    const wrapper = await mountEmptyState();

    expect(wrapper.find("h3").exists()).toBe(true);
    expect(wrapper.find("p").exists()).toBe(true);
  });

  it("renders a caller-supplied icon glyph decoratively", async () => {
    const wrapper = await mountEmptyState({ icon: "📭" });

    expect(wrapper.text()).toContain("📭");
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true);
  });

  it("falls back to the default icon when none is supplied", async () => {
    const wrapper = await mountEmptyState();

    expect(wrapper.text()).not.toContain("📭");
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true);
  });

  it("renders the actions slot", async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { titleKey: TITLE_KEY, descriptionKey: DESCRIPTION_KEY },
      slots: { actions: '<button type="button">Reset filters</button>' },
    });

    expect(wrapper.text()).toContain("Reset filters");
  });
});

describe("EmptyState call to action", () => {
  it("renders no call to action when no label key is supplied", async () => {
    const wrapper = await mountEmptyState();

    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("renders a link when both a label key and a route are supplied", async () => {
    const wrapper = await mountEmptyState({
      ctaLabelKey: CTA_LABEL_KEY,
      ctaTo: APP_ROUTES.jobs,
    });

    expect(wrapper.find("a").exists()).toBe(true);
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("renders a button when a label key is supplied without a route", async () => {
    const wrapper = await mountEmptyState({ ctaLabelKey: CTA_LABEL_KEY });

    expect(wrapper.find("button").exists()).toBe(true);
    expect(wrapper.find("a").exists()).toBe(false);
  });

  it("ignores a route supplied without a label key", async () => {
    const wrapper = await mountEmptyState({ ctaTo: APP_ROUTES.jobs });

    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("emits cta when the button is activated", async () => {
    const wrapper = await mountEmptyState({ ctaLabelKey: CTA_LABEL_KEY });
    await wrapper.find("button").trigger("click");

    expect(wrapper.emitted("cta")).toBeTruthy();
  });
});

describe("EmptyState accessible labelling", () => {
  it("labels the button from the label key when no aria key is given", async () => {
    const wrapper = await mountEmptyState({ ctaLabelKey: CTA_LABEL_KEY });

    expect(wrapper.find("button").attributes("aria-label")).toBeTruthy();
  });

  it("prefers the aria key over the label key when both are given", async () => {
    const withAria = await mountEmptyState({
      ctaLabelKey: CTA_LABEL_KEY,
      ctaAriaKey: CTA_ARIA_KEY,
    });
    const withoutAria = await mountEmptyState({ ctaLabelKey: CTA_LABEL_KEY });

    expect(withAria.find("button").attributes("aria-label")).not.toBe(
      withoutAria.find("button").attributes("aria-label"),
    );
  });

  it("labels the link variant too", async () => {
    const wrapper = await mountEmptyState({
      ctaLabelKey: CTA_LABEL_KEY,
      ctaTo: APP_ROUTES.jobs,
    });

    expect(wrapper.find("a").attributes("aria-label")).toBeTruthy();
  });
});
