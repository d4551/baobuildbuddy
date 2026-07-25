import { COVER_LETTER_DEFAULT_SIGNATURE } from "@bao/shared/constants/cover-letter";
import {
  COVER_LETTER_LINE_HEIGHT,
  COVER_LETTER_MARGIN,
  COVER_LETTER_PARAGRAPH_GAP,
  COVER_LETTER_PARAGRAPH_SIZE,
} from "@bao/shared/constants/export-layout";
import {
  COUNT_EIGHTEEN,
  COUNT_FIFTEEN,
  COUNT_THIRTY_FIVE,
  COUNT_TWENTY_EIGHT,
  COUNT_TWENTY_FIVE,
} from "@bao/shared/constants/numeric";
import {
  collectDefinedStringValues,
  formatExportDate,
  toCoverLetterParagraphs,
} from "@bao/shared/utils/export-contract";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import {
  addA4Page,
  type CoverLetterPayload,
  type CoverLetterRenderContext,
  type CoverLetterUserProfile,
  toCoverLetterPdfColors,
} from "./export-service-contracts";

const fillDarkPage = (context: CoverLetterRenderContext): void => {
  if (!context.darkBackground) {
    return;
  }
  context.page.drawRectangle({
    x: 0,
    y: 0,
    width: context.width,
    height: context.height,
    color: rgb(0.1, 0.1, 0.14),
  });
};

async function createCoverLetterContext(
  template?: string | null,
): Promise<CoverLetterRenderContext> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const page = addA4Page(pdfDoc);
  const { width, height } = page.getSize();
  const context: CoverLetterRenderContext = {
    pdfDoc,
    page,
    width,
    height,
    margin: COVER_LETTER_MARGIN,
    yPosition: height - COVER_LETTER_MARGIN,
    font,
    boldFont,
    colors: toCoverLetterPdfColors(template),
    darkBackground: template === "gaming",
  };
  fillDarkPage(context);
  return context;
}

function drawCoverLetterDivider(context: CoverLetterRenderContext): void {
  context.page.drawLine({
    start: { x: context.margin, y: context.yPosition },
    end: { x: context.width - context.margin, y: context.yPosition },
    thickness: 1,
    color: context.colors.line,
  });
  context.yPosition -= 24;
}

function ensureCoverLetterSpace(context: CoverLetterRenderContext, requiredSpace: number): void {
  if (context.yPosition - requiredSpace >= context.margin) {
    return;
  }

  context.page = addA4Page(context.pdfDoc);
  context.yPosition = context.height - context.margin;
  fillDarkPage(context);
}

function renderCoverLetterSender(
  context: CoverLetterRenderContext,
  userProfile: CoverLetterUserProfile,
): void {
  context.page.drawText(userProfile.name, {
    x: context.margin,
    y: context.yPosition,
    size: 24,
    font: context.boldFont,
    color: context.colors.primary,
  });
  context.yPosition -= 24;

  const contactLine = collectDefinedStringValues([
    userProfile.email,
    userProfile.phone,
    userProfile.location,
  ]).join(" | ");
  if (!contactLine) {
    return;
  }

  context.page.drawText(contactLine, {
    x: context.margin,
    y: context.yPosition,
    size: 9,
    font: context.font,
    color: context.colors.muted,
  });
  context.yPosition -= COUNT_TWENTY_EIGHT;
}

function renderCoverLetterDate(context: CoverLetterRenderContext, date: Date): void {
  context.page.drawText(formatExportDate(date), {
    x: context.margin,
    y: context.yPosition,
    size: 10,
    font: context.font,
    color: context.colors.muted,
  });
  context.yPosition -= 24;
}

function renderCoverLetterRecipient(
  context: CoverLetterRenderContext,
  coverLetter: CoverLetterPayload,
): void {
  context.page.drawText(coverLetter.company, {
    x: context.margin,
    y: context.yPosition,
    size: 11,
    font: context.boldFont,
    color: context.colors.primary,
  });
  context.yPosition -= COUNT_FIFTEEN;

  context.page.drawText(`RE: ${coverLetter.position}`, {
    x: context.margin,
    y: context.yPosition,
    size: 10,
    font: context.font,
    color: context.colors.accent,
  });
  context.yPosition -= COUNT_EIGHTEEN;
  drawCoverLetterDivider(context);
}

function drawCoverLetterLine(context: CoverLetterRenderContext, line: string): void {
  ensureCoverLetterSpace(context, COVER_LETTER_LINE_HEIGHT);
  context.page.drawText(line, {
    x: context.margin,
    y: context.yPosition,
    size: COVER_LETTER_PARAGRAPH_SIZE,
    font: context.font,
    color: context.colors.text,
  });
  context.yPosition -= COVER_LETTER_LINE_HEIGHT;
}

function drawCoverLetterParagraph(context: CoverLetterRenderContext, paragraph: string): void {
  const words = paragraph.split(" ");
  let line = "";

  for (const word of words) {
    const testLine = `${line}${word} `;
    const lineWidth = context.font.widthOfTextAtSize(testLine, COVER_LETTER_PARAGRAPH_SIZE);
    if (lineWidth > context.width - context.margin * 2 && line.length > 0) {
      drawCoverLetterLine(context, line.trim());
      line = `${word} `;
      continue;
    }
    line = testLine;
  }

  if (line.trim().length > 0) {
    drawCoverLetterLine(context, line.trim());
  }
  context.yPosition -= COVER_LETTER_PARAGRAPH_GAP;
}

function renderCoverLetterBody(context: CoverLetterRenderContext, content: unknown): void {
  for (const paragraph of toCoverLetterParagraphs(content)) {
    drawCoverLetterParagraph(context, paragraph);
  }
}

function renderCoverLetterClosing(context: CoverLetterRenderContext, signerName: string): void {
  context.yPosition -= 10;
  ensureCoverLetterSpace(context, COUNT_THIRTY_FIVE);

  context.page.drawText(COVER_LETTER_DEFAULT_SIGNATURE, {
    x: context.margin,
    y: context.yPosition,
    size: 11,
    font: context.font,
    color: context.colors.muted,
  });
  context.yPosition -= COUNT_TWENTY_FIVE;

  context.page.drawText(signerName, {
    x: context.margin,
    y: context.yPosition,
    size: 11,
    font: context.boldFont,
    color: context.colors.text,
  });
}

export async function exportCoverLetterPdf(
  coverLetter: CoverLetterPayload,
  userProfile: CoverLetterUserProfile,
): Promise<Uint8Array> {
  const context = await createCoverLetterContext(coverLetter.template);
  renderCoverLetterSender(context, userProfile);
  renderCoverLetterDate(context, new Date());
  renderCoverLetterRecipient(context, coverLetter);
  renderCoverLetterBody(context, coverLetter.content);
  renderCoverLetterClosing(context, userProfile.name);
  return context.pdfDoc.save();
}
