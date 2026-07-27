import { resolvePortfolioExportLayout } from "@bao/shared/constants/export-document-theme";
import {
  EXPORT_DARK_PAGE_BACKGROUND,
  PORTFOLIO_COMPACT_MARGIN_DELTA,
  PORTFOLIO_FOOTER_X_OFFSET,
  PORTFOLIO_FOOTER_Y,
  PORTFOLIO_MARGIN,
  RESUME_BODY_LINE_GAP,
} from "@bao/shared/constants/export-layout";
import { PDFDocument, rgb as pdfRgb, StandardFonts } from "pdf-lib";
import {
  addA4Page,
  type PortfolioRenderContext,
  toPortfolioPdfColors,
  type WrappedTextOptions,
} from "./export-service-contracts";

const fillDarkPortfolioPage = (context: PortfolioRenderContext): void => {
  if (!context.darkBackground) {
    return;
  }
  context.page.drawRectangle({
    x: 0,
    y: 0,
    width: context.width,
    height: context.height,
    color: pdfRgb(
      EXPORT_DARK_PAGE_BACKGROUND.r,
      EXPORT_DARK_PAGE_BACKGROUND.g,
      EXPORT_DARK_PAGE_BACKGROUND.b,
    ),
  });
};

export async function createPortfolioContext(
  template?: string | null,
): Promise<PortfolioRenderContext> {
  const layout = resolvePortfolioExportLayout(template);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = addA4Page(pdfDoc);
  const { width, height } = page.getSize();
  const margin =
    layout === "compact" ? PORTFOLIO_MARGIN - PORTFOLIO_COMPACT_MARGIN_DELTA : PORTFOLIO_MARGIN;
  const context: PortfolioRenderContext = {
    pdfDoc,
    page,
    width,
    height,
    margin,
    yPosition: height - margin,
    font,
    boldFont,
    colors: toPortfolioPdfColors(template),
    darkBackground: layout === "banner-dark",
    layout,
  };
  fillDarkPortfolioPage(context);
  return context;
}

export function ensurePortfolioSpace(context: PortfolioRenderContext, requiredSpace: number): void {
  if (context.yPosition - requiredSpace >= context.margin) {
    return;
  }

  context.page = addA4Page(context.pdfDoc);
  context.yPosition = context.height - context.margin;
  fillDarkPortfolioPage(context);
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
      color: context.colors.footer,
    });
  }
}
