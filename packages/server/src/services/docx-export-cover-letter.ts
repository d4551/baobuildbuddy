import { COVER_LETTER_DEFAULT_SIGNATURE } from "@bao/shared/constants/cover-letter";
import { resolveCoverLetterDocxTheme } from "@bao/shared/constants/export-document-theme";
import {
  collectDefinedStringValues,
  formatExportDate,
  toCoverLetterParagraphs,
} from "@bao/shared/utils/export-contract";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  type CoverLetterDocxTheme,
  type CoverLetterPayload,
  type CoverLetterUserProfile,
  createDivider,
  DOCX_COVER_LETTER_FONT_BODY_PT,
  DOCX_COVER_LETTER_FONT_HEADER_PT,
} from "./docx-export-contracts";

function buildCoverLetterHeader(
  userProfile: CoverLetterUserProfile,
  theme: CoverLetterDocxTheme,
): Paragraph[] {
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: userProfile.name,
          bold: true,
          size: DOCX_COVER_LETTER_FONT_HEADER_PT * 2,
          color: theme.primaryColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 60 },
    }),
  ];

  const contactParts = collectDefinedStringValues([
    userProfile.email,
    userProfile.phone,
    userProfile.location,
  ]);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join(" | "),
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            color: theme.mutedColorHex,
            font: theme.fontFamily,
          }),
        ],
        spacing: { after: 140 },
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: formatExportDate(new Date()),
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: theme.mutedColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 200 },
    }),
  );

  return children;
}

function buildCoverLetterRecipientBlock(
  coverLetter: CoverLetterPayload,
  theme: CoverLetterDocxTheme,
): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: coverLetter.company,
          bold: true,
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: theme.primaryColorHex,
          font: theme.fontFamily,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Re: ${coverLetter.position}`,
          italics: true,
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: theme.accentColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 140 },
    }),
    createDivider(theme.lineColorHex),
  ];
}

function buildCoverLetterBodyParagraphs(
  content: unknown,
  theme: CoverLetterDocxTheme,
): Paragraph[] {
  return toCoverLetterParagraphs(content).map(
    (paragraph) =>
      new Paragraph({
        children: [
          new TextRun({
            text: paragraph,
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            color: theme.textColorHex,
            font: theme.fontFamily,
          }),
        ],
        spacing: { after: 160 },
      }),
  );
}

function buildCoverLetterSignature(
  userProfile: CoverLetterUserProfile,
  theme: CoverLetterDocxTheme,
): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: COVER_LETTER_DEFAULT_SIGNATURE,
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: theme.textColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { before: 200, after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: userProfile.name,
          bold: true,
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: theme.textColorHex,
          font: theme.fontFamily,
        }),
      ],
    }),
  ];
}

export async function exportCoverLetterDocxDocument(
  coverLetter: CoverLetterPayload,
  userProfile: CoverLetterUserProfile,
): Promise<Uint8Array> {
  const theme = resolveCoverLetterDocxTheme(coverLetter.template);
  const doc = new Document({
    sections: [
      {
        children: [
          ...buildCoverLetterHeader(userProfile, theme),
          ...buildCoverLetterRecipientBlock(coverLetter, theme),
          ...buildCoverLetterBodyParagraphs(coverLetter.content, theme),
          ...buildCoverLetterSignature(userProfile, theme),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
