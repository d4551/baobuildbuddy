import { COVER_LETTER_DEFAULT_SIGNATURE } from "@bao/shared/constants/cover-letter";
import {
  collectDefinedStringValues,
  formatExportDate,
  toCoverLetterParagraphs,
} from "@bao/shared/utils/export-contract";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  COVER_LETTER_DOCX_FONT_FAMILY,
  COVER_LETTER_DOCX_LINE_COLOR,
  COVER_LETTER_DOCX_MUTED_COLOR,
  COVER_LETTER_DOCX_PRIMARY_COLOR,
  COVER_LETTER_DOCX_SUBTLE_COLOR,
  COVER_LETTER_DOCX_TEXT_COLOR,
  type CoverLetterPayload,
  type CoverLetterUserProfile,
  createDivider,
  DOCX_COVER_LETTER_FONT_BODY_PT,
  DOCX_COVER_LETTER_FONT_HEADER_PT,
} from "./docx-export-contracts";

function buildCoverLetterHeader(userProfile: CoverLetterUserProfile): Paragraph[] {
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: userProfile.name,
          bold: true,
          size: DOCX_COVER_LETTER_FONT_HEADER_PT * 2,
          color: COVER_LETTER_DOCX_PRIMARY_COLOR,
          font: COVER_LETTER_DOCX_FONT_FAMILY,
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
            color: COVER_LETTER_DOCX_MUTED_COLOR,
            font: COVER_LETTER_DOCX_FONT_FAMILY,
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
          color: COVER_LETTER_DOCX_MUTED_COLOR,
          font: COVER_LETTER_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 200 },
    }),
  );

  return children;
}

function buildCoverLetterRecipientBlock(coverLetter: CoverLetterPayload): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: coverLetter.company,
          bold: true,
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: COVER_LETTER_DOCX_PRIMARY_COLOR,
          font: COVER_LETTER_DOCX_FONT_FAMILY,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Re: ${coverLetter.position}`,
          italics: true,
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: COVER_LETTER_DOCX_SUBTLE_COLOR,
          font: COVER_LETTER_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 140 },
    }),
    createDivider(COVER_LETTER_DOCX_LINE_COLOR),
  ];
}

function buildCoverLetterBodyParagraphs(content: unknown): Paragraph[] {
  return toCoverLetterParagraphs(content).map(
    (paragraph) =>
      new Paragraph({
        children: [
          new TextRun({
            text: paragraph,
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            color: COVER_LETTER_DOCX_TEXT_COLOR,
            font: COVER_LETTER_DOCX_FONT_FAMILY,
          }),
        ],
        spacing: { after: 160 },
      }),
  );
}

function buildCoverLetterSignature(userProfile: CoverLetterUserProfile): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: COVER_LETTER_DEFAULT_SIGNATURE,
          size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
          color: COVER_LETTER_DOCX_TEXT_COLOR,
          font: COVER_LETTER_DOCX_FONT_FAMILY,
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
          color: COVER_LETTER_DOCX_TEXT_COLOR,
          font: COVER_LETTER_DOCX_FONT_FAMILY,
        }),
      ],
    }),
  ];
}

export async function exportCoverLetterDocxDocument(
  coverLetter: CoverLetterPayload,
  userProfile: CoverLetterUserProfile,
): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          ...buildCoverLetterHeader(userProfile),
          ...buildCoverLetterRecipientBlock(coverLetter),
          ...buildCoverLetterBodyParagraphs(coverLetter.content),
          ...buildCoverLetterSignature(userProfile),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
