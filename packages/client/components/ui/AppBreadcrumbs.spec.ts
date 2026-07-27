// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { BreadcrumbItem as Crumb } from "~/types/ui-components";
import AppBreadcrumbs from "./AppBreadcrumbs.vue";

/** Labels are held separately so assertions never traverse the fixture's type. */
const ROOT_LABEL = "Jobs";
const MID_LABEL = "Studios";
const LEAF_LABEL = "Lead Artist";
const ROUTELESS_LABEL = "Archive";

const ROOT_CRUMB: Crumb = { label: ROOT_LABEL, to: APP_ROUTES.jobs };
const MID_CRUMB: Crumb = { label: MID_LABEL, to: APP_ROUTES.studios };
const LEAF_CRUMB: Crumb = { label: LEAF_LABEL };

/** Full trail used where the assertion counts rendered nodes against the fixture. */
const FULL_TRAIL = [ROOT_CRUMB, MID_CRUMB, LEAF_CRUMB];

const mountCrumbs = async (crumbs: readonly Crumb[], sizeClass?: string) =>
  await mountSuspended(AppBreadcrumbs, {
    props: sizeClass ? { crumbs, sizeClass } : { crumbs },
  });

describe("AppBreadcrumbs structure", () => {
  it("exposes a labelled navigation landmark", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, LEAF_CRUMB]);
    const nav = wrapper.find("nav");

    expect(nav.exists()).toBe(true);
    expect(nav.attributes("aria-label")).toBeTruthy();
  });

  it("renders one list item per crumb", async () => {
    const wrapper = await mountCrumbs(FULL_TRAIL);

    expect(wrapper.findAll("li")).toHaveLength(FULL_TRAIL.length);
  });

  it("renders an empty list when given no crumbs", async () => {
    const wrapper = await mountCrumbs([]);

    expect(wrapper.findAll("li")).toHaveLength(0);
  });

  it("renders every crumb label", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, MID_CRUMB, LEAF_CRUMB]);

    for (const label of [ROOT_LABEL, MID_LABEL, LEAF_LABEL]) {
      expect(wrapper.text()).toContain(label);
    }
  });
});

describe("AppBreadcrumbs current page", () => {
  it("marks the last crumb as the current page", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, LEAF_CRUMB]);
    const current = wrapper.findAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]?.text()).toBe(LEAF_LABEL);
  });

  it("never links the last crumb even when it carries a route", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, MID_CRUMB]);
    const links = wrapper.findAll("a");

    expect(links).toHaveLength(1);
    expect(links[0]?.text()).toBe(ROOT_LABEL);
  });

  it("marks a sole crumb as the current page", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB]);

    expect(wrapper.findAll("a")).toHaveLength(0);
    expect(wrapper.find('[aria-current="page"]').text()).toBe(ROOT_LABEL);
  });
});

describe("AppBreadcrumbs links", () => {
  it("links preceding crumbs that carry a route", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, MID_CRUMB, LEAF_CRUMB]);

    expect(wrapper.findAll("a").map((a) => a.text())).toEqual([ROOT_LABEL, MID_LABEL]);
  });

  it("renders a routeless crumb as plain text", async () => {
    const wrapper = await mountCrumbs([{ label: ROUTELESS_LABEL }, LEAF_CRUMB]);

    expect(wrapper.findAll("a")).toHaveLength(0);
    expect(wrapper.text()).toContain(ROUTELESS_LABEL);
  });
});

describe("AppBreadcrumbs landmark naming", () => {
  it("names the landmark as a breadcrumb trail by default", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, LEAF_CRUMB]);

    expect(wrapper.find("nav").attributes("aria-label")).toBe("Breadcrumb");
  });

  /**
   * The navbar renders a single-item section indicator through this component. Sharing
   * the default name gave the page two identically-labelled navigation landmarks, which
   * landmark navigation cannot tell apart.
   */
  it("lets a non-trail caller name its own landmark", async () => {
    const wrapper = await mountSuspended(AppBreadcrumbs, {
      props: { crumbs: [ROOT_CRUMB], labelKey: "a11y.currentSection" },
    });

    expect(wrapper.find("nav").attributes("aria-label")).toBe("Current section");
  });
});

describe("AppBreadcrumbs sizing", () => {
  it("defaults to the small type scale", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, LEAF_CRUMB]);

    expect(wrapper.find("nav").classes()).toContain("text-sm");
  });

  it("honours a caller-supplied type scale", async () => {
    const wrapper = await mountCrumbs([ROOT_CRUMB, LEAF_CRUMB], "text-base");

    expect(wrapper.find("nav").classes()).toContain("text-base");
  });
});
