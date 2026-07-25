import { PORTFOLIO_PROJECT_SPACE } from "@bao/shared/constants/export-layout";
import {
  COUNT_FIFTEEN,
  COUNT_THIRTEEN,
  COUNT_TWENTY,
  COUNT_TWENTY_FIVE,
  COUNT_TWENTY_TWO,
} from "@bao/shared/constants/numeric";
import type { PortfolioProject } from "@bao/shared/types/portfolio";
import { collectDefinedStringValues } from "@bao/shared/utils/export-contract";
import type { PortfolioRenderContext } from "./export-service-contracts";
import { drawPortfolioWrappedText, ensurePortfolioSpace } from "./export-service-portfolio-context";

function renderPortfolioProjectHeading(
  context: PortfolioRenderContext,
  project: PortfolioProject,
  index: number,
): void {
  context.page.drawText(`CASE STUDY ${index + 1}`, {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.boldFont,
    color: context.colors.accent,
  });
  context.yPosition -= COUNT_THIRTEEN;

  context.page.drawText(`${index + 1}. ${project.title}`, {
    x: context.margin,
    y: context.yPosition,
    size: 18,
    font: context.boldFont,
    color: context.colors.primary,
  });
  context.yPosition -= COUNT_TWENTY_TWO;

  if (!project.featured) {
    return;
  }

  context.page.drawText("* FEATURED", {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.boldFont,
    color: context.colors.featured,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderPortfolioProjectRole(context: PortfolioRenderContext, role?: string): void {
  if (!role) {
    return;
  }

  context.page.drawText(`Role: ${role}`, {
    x: context.margin,
    y: context.yPosition,
    size: 10,
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
    size: 9,
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
    size: 9,
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
    size: 9,
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
    size: 8,
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
    thickness: 0.5,
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
    size: 10,
    color: context.colors.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
  });
  context.yPosition -= 10;

  renderPortfolioProjectTechnologies(context, project.technologies);
  renderPortfolioTechnicalDetails(context, project);
  renderPortfolioProjectLinks(context, project);
  renderPortfolioProjectTags(context, project.tags);

  context.yPosition -= COUNT_FIFTEEN;
  renderPortfolioProjectSeparator(context, index < totalProjects - 1);
}
