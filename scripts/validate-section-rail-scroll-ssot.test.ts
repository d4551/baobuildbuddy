import { describe, expect, it } from "bun:test";
import { collectSectionRailScrollViolations } from "./validate-section-rail-scroll-ssot";

describe("validate-section-rail-scroll-ssot", () => {
  it("passes when SSOT tokens are present", () => {
    const content = `
import { SCROLL_SNAP_X_MANDATORY_CLASS, SCROLL_SNAP_ALIGN_START_CLASS, SCROLL_TOUCH_PAN_X_CLASS } from "~/constants/layout";
<nav :class="[SCROLL_SNAP_X_MANDATORY_CLASS, SCROLL_TOUCH_PAN_X_CLASS]">
  <a :class="[SCROLL_SNAP_ALIGN_START_CLASS]">x</a>
</nav>
`;
    expect(collectSectionRailScrollViolations(content)).toEqual([]);
  });

  it("flags missing tokens and raw snap class literals", () => {
    const content = `<nav class="overflow-x-auto snap-x touch-pan-x"><a>x</a></nav>`;
    const violations = collectSectionRailScrollViolations(content);
    expect(violations.some((value) => value.includes("missing SSOT"))).toBe(true);
    expect(violations.some((value) => value.includes("raw scroll utility"))).toBe(true);
  });

  it("flags overflow-x-clip that would kill the section rail", () => {
    const content = `
import { SCROLL_SNAP_X_MANDATORY_CLASS, SCROLL_SNAP_ALIGN_START_CLASS, SCROLL_TOUCH_PAN_X_CLASS } from "~/constants/layout";
<section class="card overflow-x-clip">
  <nav :class="[SCROLL_SNAP_X_MANDATORY_CLASS, SCROLL_TOUCH_PAN_X_CLASS]">
    <a :class="[SCROLL_SNAP_ALIGN_START_CLASS]">x</a>
  </nav>
</section>
`;
    const violations = collectSectionRailScrollViolations(content);
    expect(violations.some((value) => value.includes("overflow-x-clip"))).toBe(true);
  });
});
