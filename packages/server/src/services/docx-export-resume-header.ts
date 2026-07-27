import type { ResumePersonalInfo } from "@bao/shared/types/resume";
import { collectDefinedStringValues } from "@bao/shared/utils/export-contract";
import { AlignmentType, Paragraph, TextRun } from "docx";
import {
  DOCX_RESUME_FONT_ACCENT_PT,
  DOCX_RESUME_FONT_NAME_PT,
  type DocxTemplateConfig,
} from "./docx-export-contracts";

export function buildResumeHeader(
  info: ResumePersonalInfo,
  config: DocxTemplateConfig,
): Paragraph[] {
  const items: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: info.name ?? "",
          bold: true,
          size: DOCX_RESUME_FONT_NAME_PT * 2,
          color: config.primaryColorHex,
          font: config.fontFamily,
        }),
      ],
      spacing: { after: 60 },
    }),
  ];

  const contactParts = collectDefinedStringValues([info.email, info.phone, info.location]);
  if (contactParts.length > 0) {
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contactParts.join(" | "),
            size: DOCX_RESUME_FONT_ACCENT_PT * 2,
            color: config.secondaryColorHex,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 40 },
      }),
    );
  }

  const linkParts = collectDefinedStringValues([info.linkedIn, info.portfolio, info.github]);
  if (linkParts.length > 0) {
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: linkParts.join(" | "),
            size: DOCX_RESUME_FONT_ACCENT_PT * 2,
            color: config.accentColorHex,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  return items;
}
