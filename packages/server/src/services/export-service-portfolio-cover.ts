import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { PORTFOLIO_PDF_COLORS, type PortfolioRenderContext } from "./export-service-contracts";
import { drawPortfolioWrappedText } from "./export-service-portfolio-context";

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
    color: PORTFOLIO_PDF_COLORS.muted,
  });
}

export function renderPortfolioCoverPage(
  context: PortfolioRenderContext,
  metadata: PortfolioMetadata,
): void {
  context.yPosition = context.height / 2 + 100;

  context.page.drawText("PORTFOLIO", {
    x: context.margin,
    y: context.yPosition,
    size: 36,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.primary,
  });
  context.yPosition -= 50;

  if (metadata.title) {
    context.page.drawText(metadata.title, {
      x: context.margin,
      y: context.yPosition,
      size: 20,
      font: context.boldFont,
      color: PORTFOLIO_PDF_COLORS.text,
    });
    context.yPosition -= 30;
  }

  if (metadata.author) {
    context.page.drawText(`By ${metadata.author}`, {
      x: context.margin,
      y: context.yPosition,
      size: 14,
      font: context.font,
      color: PORTFOLIO_PDF_COLORS.text,
    });
    context.yPosition -= 25;
  }

  if (metadata.description) {
    drawPortfolioWrappedText(context, {
      text: metadata.description,
      x: context.margin,
      size: 11,
      color: PORTFOLIO_PDF_COLORS.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2,
    });
    context.yPosition -= 20;
  }

  if (metadata.website) {
    context.page.drawText(metadata.website, {
      x: context.margin,
      y: context.yPosition,
      size: 10,
      font: context.font,
      color: PORTFOLIO_PDF_COLORS.accent,
    });
    context.yPosition -= 20;
  }

  renderPortfolioSocialLinks(context, metadata.social);
}

export function startPortfolioProjectsSection(context: PortfolioRenderContext): void {
  context.page = context.pdfDoc.addPage([context.width, context.height]);
  context.yPosition = context.height - context.margin;

  context.page.drawText("PROJECTS", {
    x: context.margin,
    y: context.yPosition,
    size: 24,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.primary,
  });
  context.yPosition -= 40;
}
