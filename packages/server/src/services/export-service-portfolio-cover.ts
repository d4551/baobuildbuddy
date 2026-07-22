import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { PORTFOLIO_PDF_COLORS, type PortfolioRenderContext } from "./export-service-contracts";
import { drawPortfolioWrappedText, ensurePortfolioSpace } from "./export-service-portfolio-context";
const NUM_16 = 16;
const NUM_18 = 18;
const NUM_22 = 22;
const NUM_26 = 26;
const NUM_32 = 32;
const NUM_8 = 8;

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
  context.yPosition -= NUM_16;
}

function renderPortfolioTitleBlock(
  context: PortfolioRenderContext,
  metadata: PortfolioMetadata,
): void {
  context.page.drawText(metadata.title ?? "Portfolio", {
    x: context.margin,
    y: context.yPosition,
    size: 28,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.primary,
  });
  context.yPosition -= NUM_18;

  if (!metadata.author) {
    return;
  }

  context.page.drawText(metadata.author, {
    x: context.margin,
    y: context.yPosition,
    size: 12,
    font: context.font,
    color: PORTFOLIO_PDF_COLORS.muted,
  });
  context.yPosition -= NUM_18;
}

function renderPortfolioKicker(context: PortfolioRenderContext): void {
  context.page.drawText("CASE STUDIES FOR GAME INDUSTRY HIRING", {
    x: context.margin,
    y: context.yPosition,
    size: 10,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.accent,
  });
  context.yPosition -= NUM_22;
}

function renderPortfolioSummary(
  context: PortfolioRenderContext,
  metadata: PortfolioMetadata,
): void {
  const summary = metadata.description ?? metadata.bio;
  if (!summary) {
    return;
  }

  drawPortfolioWrappedText(context, {
    text: summary,
    x: context.margin,
    size: 11,
    color: PORTFOLIO_PDF_COLORS.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
    lineGap: 3,
  });
  context.yPosition -= NUM_8;
}

function renderPortfolioContactLine(
  context: PortfolioRenderContext,
  metadata: PortfolioMetadata,
): void {
  const contactLine = [metadata.website, metadata.email].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  if (contactLine.length === 0) {
    return;
  }

  context.page.drawText(contactLine.join(" | "), {
    x: context.margin,
    y: context.yPosition,
    size: 10,
    font: context.font,
    color: PORTFOLIO_PDF_COLORS.accent,
  });
  context.yPosition -= NUM_18;
}

function renderPortfolioCoverDivider(context: PortfolioRenderContext): void {
  context.page.drawLine({
    start: { x: context.margin, y: context.yPosition },
    end: { x: context.width - context.margin, y: context.yPosition },
    thickness: 1,
    color: PORTFOLIO_PDF_COLORS.line,
  });
  context.yPosition -= NUM_26;
}

export function renderPortfolioCoverPage(
  context: PortfolioRenderContext,
  metadata: PortfolioMetadata,
): void {
  context.yPosition = context.height - context.margin;
  renderPortfolioTitleBlock(context, metadata);
  renderPortfolioKicker(context);
  renderPortfolioSummary(context, metadata);
  renderPortfolioContactLine(context, metadata);
  renderPortfolioSocialLinks(context, metadata.social);
  context.yPosition -= NUM_18;
  renderPortfolioCoverDivider(context);
}

export function startPortfolioProjectsSection(context: PortfolioRenderContext): void {
  ensurePortfolioSpace(context, NUM_32);
  context.page.drawText("SELECTED CASE STUDIES", {
    x: context.margin,
    y: context.yPosition,
    size: 16,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.primary,
  });
  context.yPosition -= NUM_22;
}
