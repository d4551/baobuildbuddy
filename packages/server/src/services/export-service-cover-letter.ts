import { COVER_LETTER_DEFAULT_SIGNATURE } from "@bao/shared/constants/cover-letter";
import { resolveCoverLetterExportLayout } from "@bao/shared/constants/export-document-theme";
import {
  COVER_LETTER_ACCENT_RAIL_MARGIN_BONUS,
  COVER_LETTER_ACCENT_RAIL_WIDTH,
  COVER_LETTER_BADGE_OFFSET_Y,
  COVER_LETTER_BADGE_PADDING_X,
  COVER_LETTER_BADGE_TEXT_COLOR,
  COVER_LETTER_BADGE_TEXT_INSET_X,
  COVER_LETTER_BANNER_HEIGHT,
  COVER_LETTER_BANNER_MUTED_COLOR,
  COVER_LETTER_BANNER_NAME_COLOR,
  COVER_LETTER_BANNER_TITLE_Y_OFFSET,
  COVER_LETTER_CONTACT_LINE_SIZE,
  COVER_LETTER_META_LINE_SIZE,
  COVER_LETTER_FORMAL_DIVIDER_THICKNESS,
  COVER_LETTER_LINE_HEIGHT,
  COVER_LETTER_MARGIN,
  COVER_LETTER_NAME_SIZE_BANNER,
  COVER_LETTER_NAME_SIZE_DEFAULT,
  COVER_LETTER_PARAGRAPH_GAP,
  COVER_LETTER_PARAGRAPH_SIZE,
  EXPORT_DARK_PAGE_BACKGROUND,
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
import { PDFDocument, rgb as pdfRgb, StandardFonts } from "pdf-lib";

import {
  addA4Page,
  type CoverLetterContent,
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
    color: pdfRgb(
      EXPORT_DARK_PAGE_BACKGROUND.r,
      EXPORT_DARK_PAGE_BACKGROUND.g,
      EXPORT_DARK_PAGE_BACKGROUND.b,
    ),
  });
};

const drawAccentRail = (context: CoverLetterRenderContext): void => {
  if (context.layout !== "accent-rail") {
    return;
  }
  context.page.drawRectangle({
    x: 0,
    y: 0,
    width: COVER_LETTER_ACCENT_RAIL_WIDTH,
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
    y: context.height - COVER_LETTER_BANNER_HEIGHT,
    width: context.width,
    height: COVER_LETTER_BANNER_HEIGHT,
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
    context.yPosition = height - COVER_LETTER_BANNER_TITLE_Y_OFFSET;
  }
  if (layout === "accent-rail") {
    context.margin = COVER_LETTER_MARGIN + COVER_LETTER_ACCENT_RAIL_MARGIN_BONUS;
  }
  return context;
}

function drawCoverLetterDivider(context: CoverLetterRenderContext): void {
  const thickness =
    context.layout === "centered-formal" ? COVER_LETTER_FORMAL_DIVIDER_THICKNESS : 1;
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

function textX(
  context: CoverLetterRenderContext,
  text: string,
  size: number,
  bold = false,
): number {
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
  const nameSize =
    context.layout === "banner-dark"
      ? COVER_LETTER_NAME_SIZE_BANNER
      : COVER_LETTER_NAME_SIZE_DEFAULT;
  const nameColor =
    context.layout === "banner-dark"
      ? pdfRgb(
          COVER_LETTER_BANNER_NAME_COLOR.r,
          COVER_LETTER_BANNER_NAME_COLOR.g,
          COVER_LETTER_BANNER_NAME_COLOR.b,
        )
      : context.colors.primary;
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
    x: textX(context, contactLine, COVER_LETTER_CONTACT_LINE_SIZE),
    y: context.yPosition,
    size: COVER_LETTER_CONTACT_LINE_SIZE,
    font: context.font,
    color:
      context.layout === "banner-dark"
        ? pdfRgb(
            COVER_LETTER_BANNER_MUTED_COLOR.r,
            COVER_LETTER_BANNER_MUTED_COLOR.g,
            COVER_LETTER_BANNER_MUTED_COLOR.b,
          )
        : context.colors.muted,
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
    const badgeWidth = context.boldFont.widthOfTextAtSize(badge, 10) + COVER_LETTER_BADGE_PADDING_X;
    context.page.drawRectangle({
      x: context.margin,
      y: context.yPosition - COVER_LETTER_BADGE_OFFSET_Y,
      width: badgeWidth,
      height: 18,
      color: context.colors.primary,
    });
    context.page.drawText(badge, {
      x: context.margin + COVER_LETTER_BADGE_TEXT_INSET_X,
      y: context.yPosition,
      size: 10,
      font: context.boldFont,
      color: pdfRgb(
        COVER_LETTER_BADGE_TEXT_COLOR.r,
        COVER_LETTER_BADGE_TEXT_COLOR.g,
        COVER_LETTER_BADGE_TEXT_COLOR.b,
      ),
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
    x: textX(context, coverLetter.company, COVER_LETTER_META_LINE_SIZE, true),
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

function renderCoverLetterBody(
  context: CoverLetterRenderContext,
  content: CoverLetterContent,
): void {
  for (const paragraph of toCoverLetterParagraphs(content)) {
    drawCoverLetterParagraph(context, paragraph);
  }
}

function renderCoverLetterClosing(context: CoverLetterRenderContext, signerName: string): void {
  context.yPosition -= 10;
  ensureCoverLetterSpace(context, COUNT_THIRTY_FIVE);

  context.page.drawText(COVER_LETTER_DEFAULT_SIGNATURE, {
    x: textX(context, COVER_LETTER_DEFAULT_SIGNATURE, COVER_LETTER_META_LINE_SIZE),
    y: context.yPosition,
    size: 11,
    font: context.font,
    color: context.colors.muted,
  });
  context.yPosition -= COUNT_TWENTY_FIVE;

  context.page.drawText(signerName, {
    x: textX(context, signerName, COVER_LETTER_META_LINE_SIZE, true),
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
