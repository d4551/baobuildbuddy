import { describe, expect, test } from "bun:test";
import { COVER_LETTER_TEMPLATE_OPTIONS } from "./cover-letter";
import {
  PORTFOLIO_EXPORT_TEMPLATE_OPTIONS,
  resolveCoverLetterDocxTheme,
  resolveCoverLetterPdfPalette,
  resolvePortfolioDocxTheme,
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
});
