/**
 * Fail-closed PDF theme tests — assert SSOT palette RGB operators in content streams.
 */
import {
  COVER_LETTER_EXPORT_THEME_BY_TEMPLATE,
  PORTFOLIO_EXPORT_LAYOUT_BY_TEMPLATE,
  PORTFOLIO_EXPORT_THEME_BY_TEMPLATE,
} from "@bao/shared/constants/export-document-theme";
import {
  EXPORT_DARK_PAGE_BACKGROUND,
  PORTFOLIO_PROJECT_LABEL_SIZE,
  PORTFOLIO_PROJECT_TITLE_SIZE_BY_LAYOUT,
} from "@bao/shared/constants/export-layout";
import { describe, expect, test } from "bun:test";
import { exportCoverLetterPdf } from "./export-service-cover-letter";
import { exportPortfolioPdf } from "./export-service-portfolio";
import { pdfStreamsContainRgbFill, pdfTextRunFontSize } from "@bao/shared/utils/pdf-streams";

const COVER_PROFILE = {
  name: "Bao Theme Proof",
  email: "bao@example.com",
  location: "Remote",
};

const COVER_CONTENT =
  "I am writing to apply for the Gameplay Engineer role. My shipped titles and systems work map cleanly to your stack.";

const PORTFOLIO_METADATA = {
  author: "Bao Theme Proof",
  title: "Gameplay Systems Engineer",
  bio: "Portfolio theme proof bio for distinct PDF palettes.",
  email: "bao@example.com",
};

const PORTFOLIO_PROJECTS = [
  {
    id: "theme-proof-project",
    title: "Dungeon Netcode Demo",
    description: "Multiplayer combat prototype with live ops tooling.",
    technologies: ["TypeScript", "Playwright"],
    featured: true,
  },
];

describe("cover letter PDF templates embed distinct SSOT palettes", () => {
  test("professional vs creative vs gaming primary fills differ and match SSOT", async () => {
    const professional = await exportCoverLetterPdf(
      {
        company: "Studio Alpha",
        position: "Gameplay Engineer",
        content: COVER_CONTENT,
        template: "professional",
      },
      COVER_PROFILE,
    );
    const creative = await exportCoverLetterPdf(
      {
        company: "Studio Alpha",
        position: "Gameplay Engineer",
        content: COVER_CONTENT,
        template: "creative",
      },
      COVER_PROFILE,
    );
    const gaming = await exportCoverLetterPdf(
      {
        company: "Studio Alpha",
        position: "Gameplay Engineer",
        content: COVER_CONTENT,
        template: "gaming",
      },
      COVER_PROFILE,
    );

    expect(
      pdfStreamsContainRgbFill(
        professional,
        COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.professional.primary,
      ),
    ).toBe(true);
    expect(
      pdfStreamsContainRgbFill(creative, COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.creative.primary),
    ).toBe(true);
    expect(
      pdfStreamsContainRgbFill(gaming, COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.gaming.primary),
    ).toBe(true);

    expect(
      pdfStreamsContainRgbFill(
        professional,
        COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.creative.primary,
      ),
    ).toBe(false);
    expect(
      pdfStreamsContainRgbFill(
        creative,
        COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.professional.primary,
      ),
    ).toBe(false);
    expect(
      pdfStreamsContainRgbFill(gaming, COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.professional.primary),
    ).toBe(false);

    // Gaming dark page fill from export-service-cover-letter fillDarkPage
    expect(pdfStreamsContainRgbFill(gaming, EXPORT_DARK_PAGE_BACKGROUND)).toBe(true);
    expect(pdfStreamsContainRgbFill(professional, EXPORT_DARK_PAGE_BACKGROUND)).toBe(false);
  });
});

describe("portfolio PDF templates embed distinct SSOT palettes", () => {
  test("modern vs gaming vs showcase primary fills differ and match SSOT", async () => {
    const modern = await exportPortfolioPdf(PORTFOLIO_METADATA, PORTFOLIO_PROJECTS, "modern");
    const gaming = await exportPortfolioPdf(PORTFOLIO_METADATA, PORTFOLIO_PROJECTS, "gaming");
    const showcase = await exportPortfolioPdf(PORTFOLIO_METADATA, PORTFOLIO_PROJECTS, "showcase");

    expect(
      pdfStreamsContainRgbFill(modern, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.modern.primary),
    ).toBe(true);
    expect(
      pdfStreamsContainRgbFill(gaming, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.gaming.primary),
    ).toBe(true);
    expect(
      pdfStreamsContainRgbFill(showcase, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.showcase.primary),
    ).toBe(true);

    expect(
      pdfStreamsContainRgbFill(modern, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.gaming.primary),
    ).toBe(false);
    expect(
      pdfStreamsContainRgbFill(gaming, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.modern.primary),
    ).toBe(false);
    expect(
      pdfStreamsContainRgbFill(showcase, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.modern.primary),
    ).toBe(false);

    expect(pdfStreamsContainRgbFill(gaming, EXPORT_DARK_PAGE_BACKGROUND)).toBe(true);
    expect(pdfStreamsContainRgbFill(modern, EXPORT_DARK_PAGE_BACKGROUND)).toBe(false);
  });
});

describe("portfolio PDF project geometry tracks the per-layout SSOT sizes", () => {
  test("project titles render at the title size mapped to each template's layout", async () => {
    const templates = ["modern", "minimal", "showcase", "gaming"] as const;

    const rendered = await Promise.all(
      templates.map(async (template) => ({
        template,
        bytes: await exportPortfolioPdf(PORTFOLIO_METADATA, PORTFOLIO_PROJECTS, template),
      })),
    );

    for (const { template, bytes } of rendered) {
      const layout = PORTFOLIO_EXPORT_LAYOUT_BY_TEMPLATE[template];
      const expectedSize = PORTFOLIO_PROJECT_TITLE_SIZE_BY_LAYOUT[layout];
      // Compact drops the "1. " ordinal prefix; every other layout keeps it.
      const renderedTitle =
        layout === "compact"
          ? PORTFOLIO_PROJECTS[0].title
          : `1. ${String(PORTFOLIO_PROJECTS[0].title)}`;

      expect(pdfTextRunFontSize(bytes, renderedTitle)).toBe(expectedSize);
    }
  });

  test("compact layout renders a smaller project title than the standard layout", async () => {
    const compact = await exportPortfolioPdf(PORTFOLIO_METADATA, PORTFOLIO_PROJECTS, "minimal");
    const standard = await exportPortfolioPdf(PORTFOLIO_METADATA, PORTFOLIO_PROJECTS, "modern");

    const compactSize = pdfTextRunFontSize(compact, PORTFOLIO_PROJECTS[0].title);
    const standardSize = pdfTextRunFontSize(standard, `1. ${String(PORTFOLIO_PROJECTS[0].title)}`);

    expect(compactSize).not.toBeNull();
    expect(standardSize).not.toBeNull();
    expect(compactSize).toBeLessThan(standardSize ?? 0);
  });

  test("showcase renders the FEATURED badge label at the shared project label size", async () => {
    const showcase = await exportPortfolioPdf(PORTFOLIO_METADATA, PORTFOLIO_PROJECTS, "showcase");

    expect(pdfTextRunFontSize(showcase, "FEATURED")).toBe(PORTFOLIO_PROJECT_LABEL_SIZE);
  });
});
