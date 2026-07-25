import {
  COUNT_EIGHT,
  COUNT_EIGHTEEN,
  COUNT_SIXTEEN,
  COUNT_THIRTY_TWO,
  COUNT_TWENTY_SIX,
  COUNT_TWENTY_TWO,
} from "@bao/shared/constants/numeric";
import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import type { PortfolioRenderContext } from "./export-service-contracts";
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
    color: context.colors.subtle,
  });
  context.yPosition -= COUNT_SIXTEEN;
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
    color: context.colors.primary,
  });
  context.yPosition -= COUNT_EIGHTEEN;

  if (!metadata.author) {
    return;
  }

  context.page.drawText(metadata.author, {
    x: context.margin,
    y: context.yPosition,
    size: 12,
    font: context.font,
    color: context.colors.muted,
  });
  context.yPosition -= COUNT_EIGHTEEN;
}

function renderPortfolioKicker(context: PortfolioRenderContext): void {
  context.page.drawText("CASE STUDIES FOR GAME INDUSTRY HIRING", {
    x: context.margin,
    y: context.yPosition,
    size: 10,
    font: context.boldFont,
    color: context.colors.accent,
  });
  context.yPosition -= COUNT_TWENTY_TWO;
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
    color: context.colors.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
    lineGap: 3,
  });
  context.yPosition -= COUNT_EIGHT;
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
    color: context.colors.accent,
  });
  context.yPosition -= COUNT_EIGHTEEN;
}

function renderPortfolioCoverDivider(context: PortfolioRenderContext): void {
  context.page.drawLine({
    start: { x: context.margin, y: context.yPosition },
    end: { x: context.width - context.margin, y: context.yPosition },
    thickness: 1,
    color: context.colors.line,
  });
  context.yPosition -= COUNT_TWENTY_SIX;
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
  context.yPosition -= COUNT_EIGHTEEN;
  renderPortfolioCoverDivider(context);
}

export function startPortfolioProjectsSection(context: PortfolioRenderContext): void {
  ensurePortfolioSpace(context, COUNT_THIRTY_TWO);
  context.page.drawText("SELECTED CASE STUDIES", {
    x: context.margin,
    y: context.yPosition,
    size: 16,
    font: context.boldFont,
    color: context.colors.primary,
  });
  context.yPosition -= COUNT_TWENTY_TWO;
}
