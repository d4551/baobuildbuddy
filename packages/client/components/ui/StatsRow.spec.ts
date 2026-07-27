// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { StatItem } from "~/types/ui-components";
import StatsRow from "./StatsRow.vue";

/** Held separately so assertions never read the value back off the fixture. */
const TOTAL_SESSIONS_VALUE = 0;
const NO_DATA_VALUE = "No data yet";

const TOTAL_SESSIONS: StatItem = {
  titleKey: "interviewHub.stats.totalSessionsTitle",
  value: TOTAL_SESSIONS_VALUE,
  valueClass: "text-primary",
  descKey: "interviewHub.stats.totalSessionsDesc",
};

const AVERAGE_SCORE: StatItem = {
  titleKey: "interviewHub.stats.averageScoreTitle",
  value: NO_DATA_VALUE,
  valueClass: "text-secondary",
  descKey: "interviewHub.stats.averageScoreDesc",
};

const mountStats = async (stats: readonly StatItem[], backgroundClass?: string) =>
  await mountSuspended(StatsRow, {
    props: backgroundClass ? { stats, backgroundClass } : { stats },
  });

describe("StatsRow composition", () => {
  it("renders one stat cell per supplied item", async () => {
    const wrapper = await mountStats([TOTAL_SESSIONS, AVERAGE_SCORE]);

    expect(wrapper.findAll(".stat")).toHaveLength(2);
  });

  it("renders nothing when no stats are supplied", async () => {
    const wrapper = await mountStats([]);

    expect(wrapper.findAll(".stat")).toHaveLength(0);
  });

  it("gives every cell a title, value, and description slot", async () => {
    const wrapper = await mountStats([TOTAL_SESSIONS]);
    const cell = wrapper.find(".stat");

    expect(cell.find(".stat-title").exists()).toBe(true);
    expect(cell.find(".stat-value").exists()).toBe(true);
    expect(cell.find(".stat-desc").exists()).toBe(true);
  });
});

describe("StatsRow values", () => {
  it("renders a numeric value verbatim", async () => {
    const wrapper = await mountStats([TOTAL_SESSIONS]);

    expect(wrapper.find(".stat-value").text()).toBe(String(TOTAL_SESSIONS_VALUE));
  });

  it("renders a string value verbatim so empty-state copy survives", async () => {
    const wrapper = await mountStats([AVERAGE_SCORE]);

    expect(wrapper.find(".stat-value").text()).toBe(NO_DATA_VALUE);
  });

  it("applies the caller-supplied tone to the value", async () => {
    const wrapper = await mountStats([AVERAGE_SCORE]);

    expect(wrapper.find(".stat-value").classes()).toContain("text-secondary");
  });

  it("keeps each cell's tone independent", async () => {
    const wrapper = await mountStats([TOTAL_SESSIONS, AVERAGE_SCORE]);
    const values = wrapper.findAll(".stat-value");

    expect(values[0]?.classes()).toContain("text-primary");
    expect(values[1]?.classes()).toContain("text-secondary");
  });
});

describe("StatsRow figures", () => {
  it("omits the figure slot when no icon is supplied", async () => {
    const wrapper = await mountStats([TOTAL_SESSIONS]);

    expect(wrapper.find(".stat-figure").exists()).toBe(false);
  });

  it("hides a supplied figure from assistive technology", async () => {
    const wrapper = await mountStats([{ ...TOTAL_SESSIONS, figure: "IconCheckCircle" }]);
    const figure = wrapper.find(".stat-figure");

    expect(figure.exists()).toBe(true);
    expect(figure.attributes("aria-hidden")).toBe("true");
  });
});

describe("StatsRow surface", () => {
  it("applies a caller-supplied background in place of the default", async () => {
    const wrapper = await mountStats([TOTAL_SESSIONS], "bg-base-200");

    expect(wrapper.classes()).toContain("bg-base-200");
  });

  it("does not carry the default entrance animation when overridden", async () => {
    const wrapper = await mountStats([TOTAL_SESSIONS], "bg-base-200");

    expect(wrapper.classes().join(" ")).not.toContain("glass-card-enter");
  });
});
