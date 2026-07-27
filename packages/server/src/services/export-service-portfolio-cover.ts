import {
  COUNT_EIGHT,
  COUNT_EIGHTEEN,
  COUNT_SIXTEEN,
  COUNT_THIRTY_TWO,
  COUNT_TWENTY_SIX,
  COUNT_TWENTY_TWO,
} from "@bao/shared/constants/numeric";
import {
  PORTFOLIO_BANNER_AUTHOR_Y_OFFSET,
  PORTFOLIO_BANNER_MUTED_COLOR,
  PORTFOLIO_BANNER_TITLE_COLOR,
  PORTFOLIO_COVER_AUTHOR_SIZE_BY_LAYOUT,
  PORTFOLIO_COVER_TITLE_SIZE_BY_LAYOUT,
  PORTFOLIO_DARK_BANNER_HEIGHT,
  PORTFOLIO_DARK_TITLE_Y_OFFSET,
  PORTFOLIO_PROJECTS_HEADING_BY_LAYOUT,
  PORTFOLIO_PROJECTS_HEADING_SIZE_BY_LAYOUT,
  PORTFOLIO_SHOWCASE_BANNER_HEIGHT,
  PORTFOLIO_SHOWCASE_TITLE_Y_OFFSET,
} from "@bao/shared/constants/export-layout";
import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { rgb as pdfRgb } from "pdf-lib";
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

function drawBannerForLayout(context: PortfolioRenderContext): void {
  if (context.layout === "showcase") {
    context.page.drawRectangle({
      x: 0,
      y: context.height - PORTFOLIO_SHOWCASE_BANNER_HEIGHT,
      width: context.width,
      height: PORTFOLIO_SHOWCASE_BANNER_HEIGHT,
      color: context.colors.primary,
    });
    context.yPosition = context.height - PORTFOLIO_SHOWCASE_TITLE_Y_OFFSET;
  } else if (context.layout === "banner-dark") {
    context.page.drawRectangle({
      x: 0,
      y: context.height - PORTFOLIO_DARK_BANNER_HEIGHT,
      width: context.width,
      height: PORTFOLIO_DARK_BANNER_HEIGHT,
      color: context.colors.primary,
    });
    context.yPosition = context.height - PORTFOLIO_DARK_TITLE_Y_OFFSET;
  }
}

function drawAuthorLine(context: PortfolioRenderContext, author: string, onBanner: boolean): void {
  context.page.drawText(author, {
    x: context.margin,
    y: context.yPosition,
    size: PORTFOLIO_COVER_AUTHOR_SIZE_BY_LAYOUT[context.layout],
    font: context.font,
    color: onBanner
      ? pdfRgb(
          PORTFOLIO_BANNER_MUTED_COLOR.r,
          PORTFOLIO_BANNER_MUTED_COLOR.g,
          PORTFOLIO_BANNER_MUTED_COLOR.b,
        )
      : context.colors.muted,
  });
  context.yPosition -= COUNT_EIGHTEEN;
  if (onBanner) {
    context.yPosition = Math.min(
      context.yPosition,
      context.height - PORTFOLIO_BANNER_AUTHOR_Y_OFFSET,
    );
  }
}

function renderPortfolioTitleBlock(
  context: PortfolioRenderContext,
  metadata: PortfolioMetadata,
): void {
  drawBannerForLayout(context);

  const title = metadata.title ?? "Portfolio";
  const titleSize = PORTFOLIO_COVER_TITLE_SIZE_BY_LAYOUT[context.layout];
  const onBanner = context.layout === "showcase" || context.layout === "banner-dark";
  const titleColor = onBanner
    ? pdfRgb(
        PORTFOLIO_BANNER_TITLE_COLOR.r,
        PORTFOLIO_BANNER_TITLE_COLOR.g,
        PORTFOLIO_BANNER_TITLE_COLOR.b,
      )
    : context.colors.primary;
  context.page.drawText(title, {
    x: context.margin,
    y: context.yPosition,
    size: titleSize,
    font: context.boldFont,
    color: titleColor,
  });
  context.yPosition -= COUNT_EIGHTEEN;

  if (!metadata.author) {
    if (onBanner) {
      context.yPosition = context.height - PORTFOLIO_BANNER_AUTHOR_Y_OFFSET;
    }
    return;
  }

  drawAuthorLine(context, metadata.author, onBanner);
}

function renderPortfolioKicker(context: PortfolioRenderContext): void {
  if (context.layout === "compact") {
    return;
  }
  const kicker =
    context.layout === "showcase" ? "FEATURED SHIP WORK" : "CASE STUDIES FOR GAME INDUSTRY HIRING";
  context.page.drawText(kicker, {
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
  const heading = PORTFOLIO_PROJECTS_HEADING_BY_LAYOUT[context.layout];
  context.page.drawText(heading, {
    x: context.margin,
    y: context.yPosition,
    size: PORTFOLIO_PROJECTS_HEADING_SIZE_BY_LAYOUT[context.layout],
    font: context.boldFont,
    color: context.colors.primary,
  });
  context.yPosition -= COUNT_TWENTY_TWO;
}
