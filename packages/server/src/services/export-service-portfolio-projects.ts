import {
  PORTFOLIO_BANNER_TITLE_COLOR,
  PORTFOLIO_FEATURED_BADGE_BASELINE_OFFSET_Y,
  PORTFOLIO_FEATURED_BADGE_HEIGHT,
  PORTFOLIO_FEATURED_BADGE_INSET_X,
  PORTFOLIO_FEATURED_BADGE_WIDTH,
  PORTFOLIO_PROJECT_BODY_SIZE,
  PORTFOLIO_PROJECT_DESCRIPTION_GAP,
  PORTFOLIO_PROJECT_LABEL_SIZE,
  PORTFOLIO_PROJECT_SEPARATOR_THICKNESS,
  PORTFOLIO_PROJECT_SPACE,
  PORTFOLIO_PROJECT_TAGS_SIZE,
  PORTFOLIO_PROJECT_TITLE_SIZE_BY_LAYOUT,
} from "@bao/shared/constants/export-layout";
import {
  COUNT_FIFTEEN,
  COUNT_THIRTEEN,
  COUNT_TWENTY,
  COUNT_TWENTY_FIVE,
  COUNT_TWENTY_TWO,
} from "@bao/shared/constants/numeric";
import type { PortfolioProject } from "@bao/shared/types/portfolio";
import { collectDefinedStringValues } from "@bao/shared/utils/export-contract";
import { type PortfolioRenderContext, toPdfColor } from "./export-service-contracts";
import { drawPortfolioWrappedText, ensurePortfolioSpace } from "./export-service-portfolio-context";

function drawFeaturedBadge(context: PortfolioRenderContext): void {
  context.page.drawRectangle({
    x: context.margin,
    y: context.yPosition - PORTFOLIO_FEATURED_BADGE_BASELINE_OFFSET_Y,
    width: PORTFOLIO_FEATURED_BADGE_WIDTH,
    height: PORTFOLIO_FEATURED_BADGE_HEIGHT,
    color: context.colors.featured,
  });
  context.page.drawText("FEATURED", {
    x: context.margin + PORTFOLIO_FEATURED_BADGE_INSET_X,
    y: context.yPosition,
    size: PORTFOLIO_PROJECT_LABEL_SIZE,
    font: context.boldFont,
    color: toPdfColor(PORTFOLIO_BANNER_TITLE_COLOR),
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function drawFeaturedInline(context: PortfolioRenderContext): void {
  context.page.drawText("* FEATURED", {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.boldFont,
    color: context.colors.featured,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderPortfolioProjectHeading(
  context: PortfolioRenderContext,
  project: PortfolioProject,
  index: number,
): void {
  if (context.layout !== "compact") {
    context.page.drawText(
      context.layout === "showcase" ? `SHIP ${index + 1}` : `CASE STUDY ${index + 1}`,
      {
        x: context.margin,
        y: context.yPosition,
        size: PORTFOLIO_PROJECT_LABEL_SIZE,
        font: context.boldFont,
        color: context.colors.accent,
      },
    );
    context.yPosition -= COUNT_THIRTEEN;
  }

  const titleSize = PORTFOLIO_PROJECT_TITLE_SIZE_BY_LAYOUT[context.layout];
  context.page.drawText(
    context.layout === "compact" ? project.title : `${index + 1}. ${project.title}`,
    {
      x: context.margin,
      y: context.yPosition,
      size: titleSize,
      font: context.boldFont,
      color: context.colors.primary,
    },
  );
  context.yPosition -= COUNT_TWENTY_TWO;

  if (!project.featured) {
    return;
  }

  if (context.layout === "showcase") {
    drawFeaturedBadge(context);
    return;
  }

  drawFeaturedInline(context);
}

function renderPortfolioProjectRole(context: PortfolioRenderContext, role?: string): void {
  if (!role) {
    return;
  }

  context.page.drawText(`Role: ${role}`, {
    x: context.margin,
    y: context.yPosition,
    size: PORTFOLIO_PROJECT_BODY_SIZE,
    font: context.boldFont,
    color: context.colors.muted,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderPortfolioProjectTechnologies(
  context: PortfolioRenderContext,
  technologies?: string[],
): void {
  if (!Array.isArray(technologies) || technologies.length === 0) {
    return;
  }

  ensurePortfolioSpace(context, COUNT_TWENTY_FIVE);
  context.page.drawText(`Technologies: ${technologies.join(", ")}`, {
    x: context.margin,
    y: context.yPosition,
    size: PORTFOLIO_PROJECT_LABEL_SIZE,
    font: context.font,
    color: context.colors.accent,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderPortfolioTechnicalDetails(
  context: PortfolioRenderContext,
  project: PortfolioProject,
): void {
  const details = collectDefinedStringValues([
    project.platforms && project.platforms.length > 0
      ? `Platforms: ${project.platforms.join(", ")}`
      : undefined,
    project.engines && project.engines.length > 0
      ? `Engines: ${project.engines.join(", ")}`
      : undefined,
  ]);
  if (details.length === 0) {
    return;
  }

  ensurePortfolioSpace(context, COUNT_TWENTY_FIVE);
  context.page.drawText(details.join(" | "), {
    x: context.margin,
    y: context.yPosition,
    size: PORTFOLIO_PROJECT_LABEL_SIZE,
    font: context.font,
    color: context.colors.muted,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderPortfolioProjectLinks(
  context: PortfolioRenderContext,
  project: PortfolioProject,
): void {
  const links = collectDefinedStringValues([
    project.liveUrl ? `Live: ${project.liveUrl}` : undefined,
    project.githubUrl ? `GitHub: ${project.githubUrl}` : undefined,
  ]);
  if (links.length === 0) {
    return;
  }

  ensurePortfolioSpace(context, COUNT_TWENTY_FIVE);
  context.page.drawText(links.join(" | "), {
    x: context.margin,
    y: context.yPosition,
    size: PORTFOLIO_PROJECT_LABEL_SIZE,
    font: context.font,
    color: context.colors.accent,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderPortfolioProjectTags(context: PortfolioRenderContext, tags?: string[]): void {
  if (!Array.isArray(tags) || tags.length === 0) {
    return;
  }

  ensurePortfolioSpace(context, COUNT_TWENTY_FIVE);
  context.page.drawText(`Tags: ${tags.join(", ")}`, {
    x: context.margin,
    y: context.yPosition,
    size: PORTFOLIO_PROJECT_TAGS_SIZE,
    font: context.font,
    color: context.colors.footer,
  });
  context.yPosition -= COUNT_TWENTY;
}

function renderPortfolioProjectSeparator(
  context: PortfolioRenderContext,
  shouldRender: boolean,
): void {
  if (!shouldRender) {
    return;
  }

  ensurePortfolioSpace(context, COUNT_TWENTY);
  context.page.drawLine({
    start: { x: context.margin, y: context.yPosition },
    end: { x: context.width - context.margin, y: context.yPosition },
    thickness: PORTFOLIO_PROJECT_SEPARATOR_THICKNESS,
    color: context.colors.line,
  });
  context.yPosition -= COUNT_TWENTY;
}

export function renderPortfolioProject(
  context: PortfolioRenderContext,
  project: PortfolioProject,
  index: number,
  totalProjects: number,
): void {
  ensurePortfolioSpace(context, PORTFOLIO_PROJECT_SPACE);
  renderPortfolioProjectHeading(context, project, index);
  renderPortfolioProjectRole(context, project.role);

  drawPortfolioWrappedText(context, {
    text: project.description,
    x: context.margin,
    size: PORTFOLIO_PROJECT_BODY_SIZE,
    color: context.colors.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
  });
  context.yPosition -= PORTFOLIO_PROJECT_DESCRIPTION_GAP;

  renderPortfolioProjectTechnologies(context, project.technologies);
  renderPortfolioTechnicalDetails(context, project);
  renderPortfolioProjectLinks(context, project);
  renderPortfolioProjectTags(context, project.tags);

  context.yPosition -= COUNT_FIFTEEN;
  renderPortfolioProjectSeparator(context, index < totalProjects - 1);
}
