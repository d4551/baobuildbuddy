// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { PAGE_HEADER_DESCRIPTION_CLASS, PAGE_HEADER_TITLE_CLASS } from "~/constants/layout";
import PageHeaderBlock from "./PageHeaderBlock.vue";

/** Props derived from the component itself — never re-declared here. */
type PageHeaderBlockProps = Partial<InstanceType<typeof PageHeaderBlock>["$props"]>;

const TITLE = "Interview Prep Hub";
const TITLE_ID = "interview-hub-title";
const DESCRIPTION = "Practice against real scraped listings.";

const mountHeader = async (props: PageHeaderBlockProps = {}, actionsSlot = "") =>
  await mountSuspended(PageHeaderBlock, {
    props: { title: TITLE, titleId: TITLE_ID, ...props },
    slots: actionsSlot ? { actions: actionsSlot } : {},
  });

describe("PageHeaderBlock content", () => {
  it("renders the title under the supplied id", async () => {
    const wrapper = await mountHeader();
    const heading = wrapper.find(`#${TITLE_ID}`);

    expect(heading.exists()).toBe(true);
    expect(heading.text()).toBe(TITLE);
  });

  it("defaults the heading to a level-one element", async () => {
    const wrapper = await mountHeader();

    expect(wrapper.find("h1").exists()).toBe(true);
  });

  it("honours an explicit heading level for nested surfaces", async () => {
    const wrapper = await mountHeader({ headingTag: "h2" });

    expect(wrapper.find("h2").exists()).toBe(true);
    expect(wrapper.find("h1").exists()).toBe(false);
  });

  it("applies the canonical title token", async () => {
    const wrapper = await mountHeader();

    expect(wrapper.find(`#${TITLE_ID}`).classes()).toEqual(
      expect.arrayContaining(PAGE_HEADER_TITLE_CLASS.split(" ")),
    );
  });

  it("omits the description paragraph when none is supplied", async () => {
    const wrapper = await mountHeader();

    expect(wrapper.find("p").exists()).toBe(false);
  });

  it("renders the description with the default token", async () => {
    const wrapper = await mountHeader({ description: DESCRIPTION });
    const paragraph = wrapper.find("p");

    expect(paragraph.text()).toBe(DESCRIPTION);
    expect(paragraph.classes()).toEqual(
      expect.arrayContaining(PAGE_HEADER_DESCRIPTION_CLASS.split(" ")),
    );
  });

  it("lets a caller override the description token", async () => {
    const wrapper = await mountHeader({
      description: DESCRIPTION,
      descriptionClass: "text-secondary",
    });

    expect(wrapper.find("p").classes()).toContain("text-secondary");
  });
});

describe("PageHeaderBlock actions", () => {
  it("omits the actions row when no actions slot is supplied", async () => {
    const wrapper = await mountHeader();

    expect(wrapper.findAll("header > div")).toHaveLength(1);
  });

  it("renders supplied actions", async () => {
    const wrapper = await mountHeader({}, "<button>Start Studio Drill</button>");

    expect(wrapper.find("button").text()).toBe("Start Studio Drill");
  });

  it("keeps the actions row from shrinking", async () => {
    const wrapper = await mountHeader({}, "<button>Start Studio Drill</button>");
    const actionsRow = wrapper.findAll("header > div")[1];

    expect(actionsRow?.classes()).toContain("shrink-0");
  });
});

describe("PageHeaderBlock lead column sizing", () => {
  /**
   * The lead column carries no grow and sits beside a `shrink-0` actions row, so at
   * `lg` the actions take their full content width and the copy takes what is left.
   * On a wide hero (title + copy + actions + step rail on one row) that leaves the
   * copy narrower at desktop than at tablet. Widening it is a hero composition change,
   * not a token change — adding `flex-1` here does nothing, because a `shrink-0`
   * sibling leaves no free space for it to claim.
   */
  it("allows the lead column to shrink below its content width", async () => {
    const wrapper = await mountHeader({ description: DESCRIPTION });
    const lead = wrapper.findAll("header > div")[0];

    expect(lead?.classes()).toContain("min-w-0");
  });

  it("places the lead column ahead of the actions row in reading order", async () => {
    const wrapper = await mountHeader(
      { description: DESCRIPTION },
      "<button>Start Studio Drill</button>",
    );
    const columns = wrapper.findAll("header > div");

    expect(columns[0]?.text()).toContain(DESCRIPTION);
    expect(columns[1]?.text()).toContain("Start Studio Drill");
  });
});
