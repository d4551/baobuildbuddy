// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { PERCENT_MAX } from "~/constants/numeric-ui";
import UiRadialMeter from "./UiRadialMeter.vue";

/** Props derived from the component itself — never re-declared here. */
type RadialMeterProps = Partial<InstanceType<typeof UiRadialMeter>["$props"]>;

const ARIA_LABEL = "Profile completion";
const HALF = PERCENT_MAX / 2;
const ABOVE_RANGE = Number.MAX_SAFE_INTEGER;
const BELOW_RANGE = Number.MIN_SAFE_INTEGER;
const NO_MAX = 0;

const mountMeter = async (props: RadialMeterProps = {}) =>
  await mountSuspended(UiRadialMeter, {
    props: { value: HALF, ariaLabel: ARIA_LABEL, ...props },
  });

const meterAttrs = async (props: RadialMeterProps = {}) => {
  const wrapper = await mountMeter(props);
  return wrapper.find('[role="progressbar"]').attributes();
};

describe("UiRadialMeter progressbar semantics", () => {
  it("exposes a labelled progressbar", async () => {
    const attrs = await meterAttrs();

    expect(attrs.role).toBe("progressbar");
    expect(attrs["aria-label"]).toBe(ARIA_LABEL);
  });

  it("reports the value range from zero to max", async () => {
    const attrs = await meterAttrs();

    expect(attrs["aria-valuemin"]).toBe("0");
    expect(attrs["aria-valuemax"]).toBe(String(PERCENT_MAX));
  });

  it("reports an in-range value unchanged", async () => {
    const attrs = await meterAttrs({ value: HALF });

    expect(attrs["aria-valuenow"]).toBe(String(HALF));
  });

  it("renders slot content inside the meter", async () => {
    const wrapper = await mountSuspended(UiRadialMeter, {
      props: { value: HALF, ariaLabel: ARIA_LABEL },
      slots: { default: "<span>50%</span>" },
    });

    expect(wrapper.text()).toContain("50%");
  });
});

describe("UiRadialMeter value clamping", () => {
  it("clamps a value above max down to max", async () => {
    const attrs = await meterAttrs({ value: ABOVE_RANGE });

    expect(attrs["aria-valuenow"]).toBe(String(PERCENT_MAX));
  });

  it("clamps a negative value up to zero", async () => {
    const attrs = await meterAttrs({ value: BELOW_RANGE });

    expect(attrs["aria-valuenow"]).toBe("0");
  });

  it("treats a non-finite value as zero", async () => {
    const attrs = await meterAttrs({ value: Number.NaN });

    expect(attrs["aria-valuenow"]).toBe("0");
  });

  it("treats infinity as non-finite input and reports zero", async () => {
    const attrs = await meterAttrs({ value: Number.POSITIVE_INFINITY });

    expect(attrs["aria-valuenow"]).toBe("0");
  });

  it("keeps aria-valuenow within the declared range for every input", async () => {
    // Mounted one at a time: mountSuspended calls cleanupAll(), so parallel mounts interfere.
    const belowRange = await meterAttrs({ value: BELOW_RANGE });
    const degenerateMax = await meterAttrs({ value: NO_MAX });
    const midRange = await meterAttrs({ value: HALF });
    const atMax = await meterAttrs({ value: PERCENT_MAX });
    const aboveRange = await meterAttrs({ value: ABOVE_RANGE });

    for (const attrs of [belowRange, degenerateMax, midRange, atMax, aboveRange]) {
      const now = Number(attrs["aria-valuenow"]);

      expect(now).toBeGreaterThanOrEqual(Number(attrs["aria-valuemin"]));
      expect(now).toBeLessThanOrEqual(Number(attrs["aria-valuemax"]));
    }
  });
});

describe("UiRadialMeter degenerate maximum", () => {
  it("does not emit a non-finite geometry when max is zero", async () => {
    const wrapper = await mountMeter({ value: HALF, max: NO_MAX });
    const offset = wrapper.findAll("circle")[1]?.attributes("stroke-dashoffset");

    expect(Number.isFinite(Number(offset))).toBe(true);
  });

  it("still reports a numeric value when max is zero", async () => {
    const attrs = await meterAttrs({ value: HALF, max: NO_MAX });

    expect(Number.isNaN(Number(attrs["aria-valuenow"]))).toBe(false);
  });
});
