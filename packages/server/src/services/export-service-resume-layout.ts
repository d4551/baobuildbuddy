import { API_ERROR_UNSUPPORTED_RESUME_TEMPLATE } from "@bao/shared/constants/api-errors";
import {
  A4_PAGE_HEIGHT,
  A4_PAGE_WIDTH,
  RESUME_BODY_LINE_GAP,
  RESUME_SECTION_HEADER_SPACING,
  RESUME_SECTION_SPACE,
} from "@bao/shared/constants/export-layout";
import { RESUME_EXPORT_THEME_CONFIGS } from "@bao/shared/constants/export-resume-theme";
import { RATIO_HALF } from "@bao/shared/constants/numeric";
import { RESUME_TEMPLATE_DEFAULT, type ResumeTemplate } from "@bao/shared/constants/resume";
import { resolveResumeExportTemplate } from "@bao/shared/utils/export-contract";
import { PDFDocument, StandardFonts } from "pdf-lib";

import {
  addA4Page,
  type ResumeRenderContext,
  type ResumeTemplateDefinition,
  toPdfColor,
  type WrappedTextOptions,
} from "./export-service-contracts";

export function resolveResumePdfTemplate(
  requestedTemplate: string | undefined,
  resumeTemplate: ResumeTemplate | undefined,
): ResumeTemplateDefinition {
  const resolvedTemplate = resolveResumeExportTemplate(requestedTemplate, resumeTemplate);
  const template =
    RESUME_EXPORT_THEME_CONFIGS[resolvedTemplate]?.pdf ??
    RESUME_EXPORT_THEME_CONFIGS[RESUME_TEMPLATE_DEFAULT]?.pdf;
  if (!template) {
    throw new Error(`${API_ERROR_UNSUPPORTED_RESUME_TEMPLATE}: ${resolvedTemplate}`);
  }
  return template;
}

export function applyResumeBackground(context: ResumeRenderContext, page = context.page): void {
  if (context.background.r >= RATIO_HALF) {
    return;
  }

  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4_PAGE_WIDTH,
    height: A4_PAGE_HEIGHT,
    color: toPdfColor(context.background),
  });
}

export function ensureResumeSpace(context: ResumeRenderContext, requiredSpace: number): void {
  if (context.yPosition - requiredSpace >= context.margin) {
    return;
  }

  context.page = addA4Page(context.pdfDoc);
  applyResumeBackground(context, context.page);
  context.yPosition = context.height - context.margin;
}

export function drawResumeWrappedLine(
  context: ResumeRenderContext,
  options: WrappedTextOptions,
  line: string,
): void {
  const lineGap = options.lineGap ?? RESUME_BODY_LINE_GAP;
  ensureResumeSpace(context, options.size + lineGap);
  context.page.drawText(line, {
    x: options.x,
    y: context.yPosition,
    size: options.size,
    font: options.font,
    color: options.color,
  });
  context.yPosition -= options.size + lineGap;
}

export function drawResumeWrappedText(
  context: ResumeRenderContext,
  options: WrappedTextOptions,
): void {
  const words = options.text.split(" ");
  let line = "";

  for (const word of words) {
    const testLine = `${line}${word} `;
    const testWidth = options.font.widthOfTextAtSize(testLine, options.size);
    if (testWidth > options.maxWidth && line.length > 0) {
      drawResumeWrappedLine(context, options, line.trim());
      line = `${word} `;
      continue;
    }
    line = testLine;
  }

  if (line.trim().length > 0) {
    drawResumeWrappedLine(context, options, line.trim());
  }
}

export async function createResumeContext(
  template: ResumeTemplateDefinition,
): Promise<ResumeRenderContext> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = addA4Page(pdfDoc);
  const { width, height } = page.getSize();

  const context: ResumeRenderContext = {
    pdfDoc,
    page,
    width,
    height,
    margin: template.spacing.margins.left,
    yPosition: height - template.spacing.margins.left,
    fonts: template.fonts,
    layout: template.layout,
    palette: {
      primary: toPdfColor(template.colors.primary),
      text: toPdfColor(template.colors.text),
      line: toPdfColor(template.colors.secondary),
      accent: toPdfColor(template.colors.accent),
    },
    background: template.colors.background,
    font,
    boldFont,
  };

  applyResumeBackground(context);
  return context;
}

export function renderResumeSectionHeader(context: ResumeRenderContext, title: string): void {
  ensureResumeSpace(context, RESUME_SECTION_SPACE);
  context.page.drawText(title, {
    x: context.margin,
    y: context.yPosition,
    size: context.fonts.header,
    font: context.boldFont,
    color: context.palette.primary,
  });
  context.yPosition -= RESUME_SECTION_HEADER_SPACING;
}
