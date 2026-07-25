import { COVER_LETTER_DEFAULT_SIGNATURE } from "@bao/shared/constants/cover-letter";
import { resolveCoverLetterExportLayout } from "@bao/shared/constants/export-document-theme";
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

const drawAccentRail = (context: CoverLetterRenderContext): void => {
  if (context.layout !== "accent-rail") {
    return;
  }
  context.page.drawRectangle({
    x: 0,
    y: 0,
    width: 14,
    height: context.height,
    color: context.colors.primary,
  });
};

const drawBannerHeader = (context: CoverLetterRenderContext): void => {
  if (context.layout !== "banner-dark") {
    return;
  }
  context.page.drawRectangle({
    x: 0,
    y: context.height - 72,
    width: context.width,
    height: 72,
    color: context.colors.primary,
  });
};

async function createCoverLetterContext(
  template?: string | null,
): Promise<CoverLetterRenderContext> {
  const layout = resolveCoverLetterExportLayout(template);
  const pdfDoc = await PDFDocument.create();
  const useHelvetica = layout === "technical-badge" || layout === "banner-dark";
  const font = await pdfDoc.embedFont(
    useHelvetica ? StandardFonts.Helvetica : StandardFonts.TimesRoman,
  );
  const boldFont = await pdfDoc.embedFont(
    useHelvetica ? StandardFonts.HelveticaBold : StandardFonts.TimesRomanBold,
  );
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
    darkBackground: layout === "banner-dark",
    layout,
  };
  fillDarkPage(context);
  drawAccentRail(context);
  drawBannerHeader(context);
  if (layout === "banner-dark") {
    context.yPosition = height - 90;
  }
  if (layout === "accent-rail") {
    context.margin = COVER_LETTER_MARGIN + 10;
  }
  return context;
}

function drawCoverLetterDivider(context: CoverLetterRenderContext): void {
  const thickness = context.layout === "centered-formal" ? 2.5 : 1;
  context.page.drawLine({
    start: { x: context.margin, y: context.yPosition },
    end: { x: context.width - context.margin, y: context.yPosition },
    thickness,
    color: context.layout === "centered-formal" ? context.colors.accent : context.colors.line,
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
  drawAccentRail(context);
}

function textX(context: CoverLetterRenderContext, text: string, size: number, bold = false): number {
  if (context.layout !== "centered-formal") {
    return context.margin;
  }
  const font = bold ? context.boldFont : context.font;
  const width = font.widthOfTextAtSize(text, size);
  return Math.max(context.margin, (context.width - width) / 2);
}

function renderCoverLetterSender(
  context: CoverLetterRenderContext,
  userProfile: CoverLetterUserProfile,
): void {
  const nameSize = context.layout === "banner-dark" ? 22 : 24;
  const nameColor =
    context.layout === "banner-dark" ? rgb(0.98, 0.98, 1) : context.colors.primary;
  context.page.drawText(userProfile.name, {
    x: textX(context, userProfile.name, nameSize, true),
    y: context.yPosition,
    size: nameSize,
    font: context.boldFont,
    color: nameColor,
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
    x: textX(context, contactLine, 9),
    y: context.yPosition,
    size: 9,
    font: context.font,
    color: context.layout === "banner-dark" ? rgb(0.92, 0.92, 0.96) : context.colors.muted,
  });
  context.yPosition -= COUNT_TWENTY_EIGHT;
}

function renderCoverLetterDate(context: CoverLetterRenderContext, date: Date): void {
  const dateText = formatExportDate(date);
  context.page.drawText(dateText, {
    x: textX(context, dateText, 10),
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
  if (context.layout === "technical-badge") {
    const badge = `ROLE // ${coverLetter.position.toUpperCase()}`;
    const badgeWidth = context.boldFont.widthOfTextAtSize(badge, 10) + 16;
    context.page.drawRectangle({
      x: context.margin,
      y: context.yPosition - 4,
      width: badgeWidth,
      height: 18,
      color: context.colors.primary,
    });
    context.page.drawText(badge, {
      x: context.margin + 8,
      y: context.yPosition,
      size: 10,
      font: context.boldFont,
      color: rgb(1, 1, 1),
    });
    context.yPosition -= COUNT_TWENTY_EIGHT;
    context.page.drawText(coverLetter.company, {
      x: context.margin,
      y: context.yPosition,
      size: 11,
      font: context.boldFont,
      color: context.colors.accent,
    });
    context.yPosition -= COUNT_EIGHTEEN;
    drawCoverLetterDivider(context);
    return;
  }

  context.page.drawText(coverLetter.company, {
    x: textX(context, coverLetter.company, 11, true),
    y: context.yPosition,
    size: 11,
    font: context.boldFont,
    color: context.colors.primary,
  });
  context.yPosition -= COUNT_FIFTEEN;

  const reLine = `RE: ${coverLetter.position}`;
  context.page.drawText(reLine, {
    x: textX(context, reLine, 10),
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
    x: textX(context, COVER_LETTER_DEFAULT_SIGNATURE, 11),
    y: context.yPosition,
    size: 11,
    font: context.font,
    color: context.colors.muted,
  });
  context.yPosition -= COUNT_TWENTY_FIVE;

  context.page.drawText(signerName, {
    x: textX(context, signerName, 11, true),
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
