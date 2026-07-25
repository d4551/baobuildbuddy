import { describe, expect, test } from "bun:test";
import { COVER_LETTER_TEMPLATE_OPTIONS } from "./cover-letter";
import {
  COVER_LETTER_EXPORT_LAYOUT_BY_TEMPLATE,
  PORTFOLIO_EXPORT_LAYOUT_BY_TEMPLATE,
  PORTFOLIO_EXPORT_TEMPLATE_OPTIONS,
  resolveCoverLetterDocxTheme,
  resolveCoverLetterExportLayout,
  resolveCoverLetterPdfPalette,
  resolvePortfolioDocxTheme,
  resolvePortfolioExportLayout,
  resolvePortfolioPdfPalette,
} from "./export-document-theme";

type PrimaryValue = string | { r: number; g: number; b: number };

function serializePrimary(value: PrimaryValue): string {
  return typeof value === "string" ? value : `${value.r}:${value.g}:${value.b}`;
}

function expectPairwiseDistinctPrimaryColors(values: readonly PrimaryValue[]): void {
  const serialized = values.map(serializePrimary);
  expect(new Set(serialized).size).toBe(serialized.length);
}

describe("export document theme resolvers", () => {
  test("cover-letter PDF primary colors differ across templates", () => {
    expectPairwiseDistinctPrimaryColors(
      COVER_LETTER_TEMPLATE_OPTIONS.map(
        (template) => resolveCoverLetterPdfPalette(template).primary,
      ),
    );
  });

  test("cover-letter DOCX primary colors differ across templates", () => {
    expectPairwiseDistinctPrimaryColors(
      COVER_LETTER_TEMPLATE_OPTIONS.map(
        (template) => resolveCoverLetterDocxTheme(template).primaryColorHex,
      ),
    );
  });

  test("portfolio PDF primary colors differ across templates", () => {
    expectPairwiseDistinctPrimaryColors(
      PORTFOLIO_EXPORT_TEMPLATE_OPTIONS.map(
        (template) => resolvePortfolioPdfPalette(template).primary,
      ),
    );
  });

  test("portfolio DOCX primary colors differ across templates", () => {
    expectPairwiseDistinctPrimaryColors(
      PORTFOLIO_EXPORT_TEMPLATE_OPTIONS.map(
        (template) => resolvePortfolioDocxTheme(template).primaryColorHex,
      ),
    );
  });

  test("invalid cover-letter templates fall back to professional palettes", () => {
    expect(resolveCoverLetterPdfPalette("unknown")).toBe(
      resolveCoverLetterPdfPalette("professional"),
    );
    expect(resolveCoverLetterDocxTheme("unknown")).toBe(
      resolveCoverLetterDocxTheme("professional"),
    );
  });

  test("invalid portfolio templates fall back to modern palettes", () => {
    expect(resolvePortfolioPdfPalette("unknown")).toBe(resolvePortfolioPdfPalette("modern"));
    expect(resolvePortfolioDocxTheme("unknown")).toBe(resolvePortfolioDocxTheme("modern"));
  });

  test("cover-letter templates map to distinct structural layouts", () => {
    const layouts = COVER_LETTER_TEMPLATE_OPTIONS.map((template) =>
      resolveCoverLetterExportLayout(template),
    );
    expect(new Set(layouts).size).toBe(COVER_LETTER_TEMPLATE_OPTIONS.length);
    expect(COVER_LETTER_EXPORT_LAYOUT_BY_TEMPLATE.gaming).toBe("banner-dark");
    expect(COVER_LETTER_EXPORT_LAYOUT_BY_TEMPLATE.creative).toBe("accent-rail");
  });

  test("portfolio templates map to distinct structural layouts", () => {
    const layouts = PORTFOLIO_EXPORT_TEMPLATE_OPTIONS.map((template) =>
      resolvePortfolioExportLayout(template),
    );
    expect(new Set(layouts).size).toBe(PORTFOLIO_EXPORT_TEMPLATE_OPTIONS.length);
    expect(PORTFOLIO_EXPORT_LAYOUT_BY_TEMPLATE.showcase).toBe("showcase");
    expect(PORTFOLIO_EXPORT_LAYOUT_BY_TEMPLATE.minimal).toBe("compact");
  });
});
