import {
  collectDefinedStringValues,
  PORTFOLIO_FOOTER_X_OFFSET,
  PORTFOLIO_FOOTER_Y,
  PORTFOLIO_MARGIN,
  PORTFOLIO_PROJECT_SPACE,
  RESUME_BODY_LINE_GAP,
  type PortfolioMetadata,
  type PortfolioProject,
} from "@bao/shared";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  addA4Page,
  PORTFOLIO_PDF_COLORS,
  type PortfolioRenderContext,
  type WrappedTextOptions,
} from "./export-service-contracts";

async function createPortfolioContext(): Promise<PortfolioRenderContext> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = addA4Page(pdfDoc);
  const { width, height } = page.getSize();

  return {
    pdfDoc,
    page,
    width,
    height,
    margin: PORTFOLIO_MARGIN,
    yPosition: height - PORTFOLIO_MARGIN,
    font,
    boldFont,
  };
}

function ensurePortfolioSpace(context: PortfolioRenderContext, requiredSpace: number): void {
  if (context.yPosition - requiredSpace >= context.margin) {
    return;
  }
  context.page = addA4Page(context.pdfDoc);
  context.yPosition = context.height - context.margin;
}

function drawPortfolioWrappedLine(
  context: PortfolioRenderContext,
  options: WrappedTextOptions,
  line: string,
): void {
  const lineGap = options.lineGap ?? RESUME_BODY_LINE_GAP;
  ensurePortfolioSpace(context, options.size + lineGap);
  context.page.drawText(line, {
    x: options.x,
    y: context.yPosition,
    size: options.size,
    font: options.font,
    color: options.color,
  });
  context.yPosition -= options.size + lineGap;
}

function drawPortfolioWrappedText(
  context: PortfolioRenderContext,
  options: WrappedTextOptions,
): void {
  const words = options.text.split(" ");
  let line = "";

  for (const word of words) {
    const testLine = `${line}${word} `;
    const testWidth = options.font.widthOfTextAtSize(testLine, options.size);
    if (testWidth > options.maxWidth && line.length > 0) {
      drawPortfolioWrappedLine(context, options, line.trim());
      line = `${word} `;
      continue;
    }
    line = testLine;
  }

  if (line.trim().length > 0) {
    drawPortfolioWrappedLine(context, options, line.trim());
  }
}

function renderPortfolioSocialLinks(
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

function renderPortfolioCoverPage(
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

function startPortfolioProjectsSection(context: PortfolioRenderContext): void {
  context.page = addA4Page(context.pdfDoc);
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

function renderPortfolioProjectHeading(
  context: PortfolioRenderContext,
  project: PortfolioProject,
  index: number,
): void {
  context.page.drawText(`${index + 1}. ${project.title}`, {
    x: context.margin,
    y: context.yPosition,
    size: 16,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.accent,
  });
  context.yPosition -= 20;

  if (!project.featured) {
    return;
  }

  context.page.drawText("* FEATURED", {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.featured,
  });
  context.yPosition -= 15;
}

function renderPortfolioProjectRole(context: PortfolioRenderContext, role?: string): void {
  if (!role) return;
  context.page.drawText(`Role: ${role}`, {
    x: context.margin,
    y: context.yPosition,
    size: 10,
    font: context.boldFont,
    color: PORTFOLIO_PDF_COLORS.text,
  });
  context.yPosition -= 15;
}

function renderPortfolioProjectTechnologies(
  context: PortfolioRenderContext,
  technologies?: string[],
): void {
  if (!Array.isArray(technologies) || technologies.length === 0) return;
  ensurePortfolioSpace(context, 25);
  context.page.drawText(`Technologies: ${technologies.join(", ")}`, {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.font,
    color: PORTFOLIO_PDF_COLORS.muted,
  });
  context.yPosition -= 15;
}

function renderPortfolioTechnicalDetails(
  context: PortfolioRenderContext,
  project: PortfolioProject,
): void {
  const details = collectDefinedStringValues([
    project.platforms && project.platforms.length > 0 ? `Platforms: ${project.platforms.join(", ")}` : undefined,
    project.engines && project.engines.length > 0 ? `Engines: ${project.engines.join(", ")}` : undefined,
  ]);
  if (details.length === 0) return;

  ensurePortfolioSpace(context, 25);
  context.page.drawText(details.join(" | "), {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.font,
    color: PORTFOLIO_PDF_COLORS.muted,
  });
  context.yPosition -= 15;
}

function renderPortfolioProjectLinks(
  context: PortfolioRenderContext,
  project: PortfolioProject,
): void {
  const links = collectDefinedStringValues([
    project.liveUrl ? `Live: ${project.liveUrl}` : undefined,
    project.githubUrl ? `GitHub: ${project.githubUrl}` : undefined,
  ]);
  if (links.length === 0) return;

  ensurePortfolioSpace(context, 25);
  context.page.drawText(links.join(" | "), {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.font,
    color: PORTFOLIO_PDF_COLORS.accent,
  });
  context.yPosition -= 15;
}

function renderPortfolioProjectTags(context: PortfolioRenderContext, tags?: string[]): void {
  if (!Array.isArray(tags) || tags.length === 0) return;
  ensurePortfolioSpace(context, 25);
  context.page.drawText(`Tags: ${tags.join(", ")}`, {
    x: context.margin,
    y: context.yPosition,
    size: 8,
    font: context.font,
    color: PORTFOLIO_PDF_COLORS.footer,
  });
  context.yPosition -= 20;
}

function renderPortfolioProjectSeparator(
  context: PortfolioRenderContext,
  shouldRender: boolean,
): void {
  if (!shouldRender) return;
  ensurePortfolioSpace(context, 20);
  context.page.drawLine({
    start: { x: context.margin, y: context.yPosition },
    end: { x: context.width - context.margin, y: context.yPosition },
    thickness: 0.5,
    color: PORTFOLIO_PDF_COLORS.line,
  });
  context.yPosition -= 20;
}

function renderPortfolioProject(
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
    color: PORTFOLIO_PDF_COLORS.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
  });
  context.yPosition -= 10;

  renderPortfolioProjectTechnologies(context, project.technologies);
  renderPortfolioTechnicalDetails(context, project);
  renderPortfolioProjectLinks(context, project);
  renderPortfolioProjectTags(context, project.tags);

  context.yPosition -= 15;
  renderPortfolioProjectSeparator(context, index < totalProjects - 1);
}

function addPortfolioPageNumbers(context: PortfolioRenderContext): void {
  const pages = context.pdfDoc.getPages();
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    page.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: context.width / 2 - PORTFOLIO_FOOTER_X_OFFSET,
      y: PORTFOLIO_FOOTER_Y,
      size: 8,
      font: context.font,
      color: PORTFOLIO_PDF_COLORS.footer,
    });
  }
}

export async function exportPortfolioPdf(
  metadata: PortfolioMetadata,
  projects: PortfolioProject[],
): Promise<Uint8Array> {
  const context = await createPortfolioContext();
  renderPortfolioCoverPage(context, metadata);
  startPortfolioProjectsSection(context);

  for (let index = 0; index < projects.length; index += 1) {
    renderPortfolioProject(context, projects[index], index, projects.length);
  }

  addPortfolioPageNumbers(context);
  return context.pdfDoc.save();
}
