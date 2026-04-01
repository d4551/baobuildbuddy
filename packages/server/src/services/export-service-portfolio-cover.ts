import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { PORTFOLIO_PDF_COLORS, type PortfolioRenderContext } from "./export-service-contracts";
import { drawPortfolioWrappedText, ensurePortfolioSpace } from "./export-service-portfolio-context";

export function renderPortfolioSocialLinks(
  context: PortfolioRenderContext,
  social?: Record<string, string>,
): void {
  if (!social || Object.keys(social).length === 0) {
    return;
  }

  const socialLinks = Object.entries(social)
    .map(([platform, url]) => `${platform}: ${url}`)
    .join(" | ");

  context.page.drawText(socialLinks, {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.font,
    color: PORTFOLIO_PDF_COLORS.subtle,
  });
  context.yPosition -= 16;
}

export function renderPortfolioCoverPage(
  context: PortfolioRenderContext,
  metadata: PortfolioMetadata,
): void {
  const summary = metadata.description ?? metadata.bio;
  context.yPosition = context.height - context.margin;
  context.page.drawText(metadata.title ?? "Portfolio", {
    x: context.margin,
    y: context.yPosition,
    size: 24,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.primary,
  });
  context.yPosition -= 26;

  if (metadata.author) {
    context.page.drawText(metadata.author, {
      x: context.margin,
      y: context.yPosition,
      size: 12,
      font: context.font,
      color: PORTFOLIO_PDF_COLORS.muted,
    });
    context.yPosition -= 18;
  }

  if (summary) {
    drawPortfolioWrappedText(context, {
      text: summary,
      x: context.margin,
      size: 11,
      color: PORTFOLIO_PDF_COLORS.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2,
      lineGap: 3,
    });
    context.yPosition -= 8;
  }

  const contactLine = [metadata.website, metadata.email].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  if (contactLine.length > 0) {
    context.page.drawText(contactLine.join(" | "), {
      x: context.margin,
      y: context.yPosition,
      size: 10,
      font: context.font,
      color: PORTFOLIO_PDF_COLORS.accent,
    });
    context.yPosition -= 18;
  }

  renderPortfolioSocialLinks(context, metadata.social);
  context.yPosition -= 18;
  context.page.drawLine({
    start: { x: context.margin, y: context.yPosition },
    end: { x: context.width - context.margin, y: context.yPosition },
    thickness: 1,
    color: PORTFOLIO_PDF_COLORS.line,
  });
  context.yPosition -= 26;
}

export function startPortfolioProjectsSection(context: PortfolioRenderContext): void {
  ensurePortfolioSpace(context, 32);
  context.page.drawText("SELECTED PROJECTS", {
    x: context.margin,
    y: context.yPosition,
    size: 16,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.primary,
  });
  context.yPosition -= 22;
}
