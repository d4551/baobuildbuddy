// @vitest-environment nuxt
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import {
  SURFACE_GLASS_CARD_CLASS,
  SURFACE_GLASS_CARD_DISABLED_CLASS,
  SURFACE_GLASS_CARD_ERROR_CLASS,
  SURFACE_GLASS_CARD_MODAL_CLASS,
  SURFACE_GLASS_CARD_SELECTED_CLASS,
  SURFACE_GLASS_CARD_STRONG_CLASS,
} from "~/constants/layout";
import { UI_STAGGER_INDEX_MAX } from "~/constants/numeric-ui";
import UiGlassCard from "./UiGlassCard.vue";

/** Props derived from the component itself — never re-declared here. */
type GlassCardProps = Partial<InstanceType<typeof UiGlassCard>["$props"]>;

/** Overflow applied past the last delay slot to prove clamping, not a delay value. */
const STAGGER_OVERFLOW_OFFSET = 99;

const mountCard = async (props: GlassCardProps = {}, slot = "") =>
  await mountSuspended(UiGlassCard, {
    props,
    slots: slot ? { default: slot } : {},
  });

const cardClasses = async (props: GlassCardProps = {}): Promise<string[]> => {
  const wrapper = await mountCard(props);
  return wrapper.find("article").classes();
};

describe("UiGlassCard surfaces", () => {
  it("renders slot content inside the card surface", async () => {
    const wrapper = await mountCard({}, "<p>card body</p>");

    expect(wrapper.find("article").exists()).toBe(true);
    expect(wrapper.text()).toContain("card body");
  });

  it("applies the standard surface by default", async () => {
    expect(await cardClasses()).toEqual(
      expect.arrayContaining(SURFACE_GLASS_CARD_CLASS.split(" ")),
    );
  });

  it("maps the strong variant to its own surface token", async () => {
    expect(await cardClasses({ variant: "strong" })).toEqual(
      expect.arrayContaining(SURFACE_GLASS_CARD_STRONG_CLASS.split(" ")),
    );
  });

  it("maps the modal variant to its own surface token", async () => {
    expect(await cardClasses({ variant: "modal" })).toEqual(
      expect.arrayContaining(SURFACE_GLASS_CARD_MODAL_CLASS.split(" ")),
    );
  });
});

describe("UiGlassCard link overlay", () => {
  it("omits the link overlay when no route is supplied", async () => {
    const wrapper = await mountCard();

    expect(wrapper.find("a").exists()).toBe(false);
  });

  it("renders a labelled link overlay when a route is supplied", async () => {
    const wrapper = await mountCard({ to: APP_ROUTES.jobs, linkAriaLabel: "Open jobs" });
    const link = wrapper.find("a");

    expect(link.exists()).toBe(true);
    expect(link.attributes("aria-label")).toBe("Open jobs");
  });
});

describe("UiGlassCard state tokens", () => {
  it("applies the selected state token when selected", async () => {
    expect(await cardClasses({ selected: true })).toEqual(
      expect.arrayContaining(SURFACE_GLASS_CARD_SELECTED_CLASS.split(" ")),
    );
  });

  it("applies the disabled state token when disabled", async () => {
    expect(await cardClasses({ disabled: true })).toEqual(
      expect.arrayContaining(SURFACE_GLASS_CARD_DISABLED_CLASS.split(" ")),
    );
  });

  it("applies the error state token when in error", async () => {
    expect(await cardClasses({ error: true })).toEqual(
      expect.arrayContaining(SURFACE_GLASS_CARD_ERROR_CLASS.split(" ")),
    );
  });

  it("carries no state tokens when every state flag is false", async () => {
    const classes = await cardClasses();

    for (const stateClass of [
      SURFACE_GLASS_CARD_SELECTED_CLASS,
      SURFACE_GLASS_CARD_DISABLED_CLASS,
      SURFACE_GLASS_CARD_ERROR_CLASS,
    ]) {
      expect(classes).not.toContain(stateClass.split(" ")[0]);
    }
  });
});

describe("UiGlassCard entrance animation", () => {
  it("omits entrance animation classes when no stagger index is given", async () => {
    const classes = await cardClasses();

    expect(classes.join(" ")).not.toContain("glass-card-enter");
  });

  it("clamps a negative stagger index up to the first delay slot", async () => {
    expect(await cardClasses({ staggerIndex: -5 })).toContain("glass-card-enter-0");
  });

  it("clamps an oversized stagger index down to the last defined delay slot", async () => {
    expect(
      await cardClasses({ staggerIndex: UI_STAGGER_INDEX_MAX + STAGGER_OVERFLOW_OFFSET }),
    ).toContain(`glass-card-enter-${UI_STAGGER_INDEX_MAX}`);
  });

  it("passes an in-range stagger index through unchanged", async () => {
    expect(await cardClasses({ staggerIndex: 1 })).toContain("glass-card-enter-1");
  });

  it("appends caller-supplied extra classes", async () => {
    expect(await cardClasses({ extraClass: "mt-4" })).toContain("mt-4");
  });
});
