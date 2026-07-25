/**
 * Fail-closed PDF theme tests — assert SSOT palette RGB operators in content streams.
 */
import {
  COVER_LETTER_EXPORT_THEME_BY_TEMPLATE,
  PORTFOLIO_EXPORT_THEME_BY_TEMPLATE,
} from "@bao/shared/constants/export-document-theme";
import { describe, expect, test } from "bun:test";
import { exportCoverLetterPdf } from "./export-service-cover-letter";
import { exportPortfolioPdf } from "./export-service-portfolio";
import { pdfStreamsContainRgbFill } from "./export-pdf-stream-utils";

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
      pdfStreamsContainRgbFill(professional, COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.creative.primary),
    ).toBe(false);
    expect(
      pdfStreamsContainRgbFill(creative, COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.professional.primary),
    ).toBe(false);
    expect(
      pdfStreamsContainRgbFill(gaming, COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.professional.primary),
    ).toBe(false);

    // Gaming dark page fill from export-service-cover-letter fillDarkPage
    expect(pdfStreamsContainRgbFill(gaming, { r: 0.1, g: 0.1, b: 0.14 })).toBe(true);
    expect(pdfStreamsContainRgbFill(professional, { r: 0.1, g: 0.1, b: 0.14 })).toBe(false);
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

    expect(pdfStreamsContainRgbFill(gaming, { r: 0.1, g: 0.1, b: 0.14 })).toBe(true);
    expect(pdfStreamsContainRgbFill(modern, { r: 0.1, g: 0.1, b: 0.14 })).toBe(false);
  });
});
