import {
  PORTFOLIO_FOOTER_X_OFFSET,
  PORTFOLIO_FOOTER_Y,
  PORTFOLIO_MARGIN,
  RESUME_BODY_LINE_GAP,
} from "@bao/shared/constants/export-layout";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  addA4Page,
  PORTFOLIO_PDF_COLORS,
  type PortfolioRenderContext,
  type WrappedTextOptions,
} from "./export-service-contracts";

export async function createPortfolioContext(): Promise<PortfolioRenderContext> {
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

export function ensurePortfolioSpace(context: PortfolioRenderContext, requiredSpace: number): void {
  if (context.yPosition - requiredSpace >= context.margin) {
    return;
  }

  context.page = addA4Page(context.pdfDoc);
  context.yPosition = context.height - context.margin;
}

export function drawPortfolioWrappedLine(
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

export function drawPortfolioWrappedText(
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

export function addPortfolioPageNumbers(context: PortfolioRenderContext): void {
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
