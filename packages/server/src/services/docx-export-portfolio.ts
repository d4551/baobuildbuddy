import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import { collectDefinedStringValues } from "@bao/shared/utils/export-contract";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  type ISectionOptions,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import {
  createDivider,
  DOCX_PORTFOLIO_FONT_BODY_PT,
  DOCX_PORTFOLIO_FONT_HEADING_PT,
  DOCX_PORTFOLIO_FONT_TITLE_PT,
  PORTFOLIO_DOCX_ACCENT_COLOR,
  PORTFOLIO_DOCX_FONT_FAMILY,
  PORTFOLIO_DOCX_FOOTER_COLOR,
  PORTFOLIO_DOCX_LINE_COLOR,
  PORTFOLIO_DOCX_MUTED_COLOR,
  PORTFOLIO_DOCX_PRIMARY_COLOR,
  PORTFOLIO_DOCX_SUBTLE_COLOR,
} from "./docx-export-contracts";

function buildPortfolioTitleParagraph(title: string | undefined): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: title ?? "Portfolio",
        bold: true,
        size: (DOCX_PORTFOLIO_FONT_TITLE_PT - 8) * 2,
        color: PORTFOLIO_DOCX_PRIMARY_COLOR,
        font: PORTFOLIO_DOCX_FONT_FAMILY,
      }),
    ],
  });
}

function buildPortfolioAuthorParagraph(author: string | undefined): Paragraph[] {
  if (!author) return [];
  return [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: author,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: PORTFOLIO_DOCX_MUTED_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
    }),
  ];
}

function buildPortfolioDescriptionParagraph(description: string | undefined): Paragraph[] {
  if (!description) return [];
  return [
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: description,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: PORTFOLIO_DOCX_SUBTLE_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
    }),
  ];
}

function buildPortfolioContactParagraph(metadata: PortfolioMetadata): Paragraph[] {
  const contactParts = collectDefinedStringValues([metadata.website, metadata.email]);
  if (contactParts.length === 0) return [];
  return [
    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: contactParts.join(" | "),
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: PORTFOLIO_DOCX_ACCENT_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
    }),
  ];
}

function buildPortfolioProjectsHeading(): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun({
        text: "Selected Projects",
        bold: true,
        size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
        color: PORTFOLIO_DOCX_PRIMARY_COLOR,
        font: PORTFOLIO_DOCX_FONT_FAMILY,
      }),
    ],
    spacing: { before: 120, after: 120 },
  });
}

function buildPortfolioProjectRole(role: string | undefined): Paragraph[] {
  if (!role) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `Role: ${role}`,
          italics: true,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: PORTFOLIO_DOCX_MUTED_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];
}

function buildPortfolioProjectTechnologies(technologies: string[] | undefined): Paragraph[] {
  if (!(technologies && technologies.length > 0)) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Technologies: ",
          bold: true,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
        new TextRun({
          text: technologies.join(", "),
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];
}

function buildPortfolioProjectTags(tags: string[] | undefined): Paragraph[] {
  if (!(tags && tags.length > 0)) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `Tags: ${tags.join(", ")}`,
          italics: true,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: PORTFOLIO_DOCX_SUBTLE_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];
}

function buildPortfolioProjectUrls(urls: string[]): Paragraph[] {
  if (urls.length === 0) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: urls.join(" | "),
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: PORTFOLIO_DOCX_ACCENT_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 80 },
    }),
  ];
}

function buildPortfolioProjectParagraphs(project: PortfolioProject, index: number): Paragraph[] {
  const urls = collectDefinedStringValues([project.liveUrl, project.githubUrl]);
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `${String(index + 1)}. ${project.title}`,
          bold: true,
          size: (DOCX_PORTFOLIO_FONT_HEADING_PT - 1) * 2,
          color: PORTFOLIO_DOCX_PRIMARY_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { before: 200, after: 20 },
    }),
    ...buildPortfolioProjectRole(project.role),
    new Paragraph({
      children: [
        new TextRun({
          text: project.description,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 80 },
    }),
    ...buildPortfolioProjectTechnologies(project.technologies),
    ...buildPortfolioProjectTags(project.tags),
    ...buildPortfolioProjectUrls(urls),
    createDivider(PORTFOLIO_DOCX_LINE_COLOR),
  ];
}

function buildPortfolioFooter(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [
      new TextRun({
        text: "Page ",
        size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
        color: PORTFOLIO_DOCX_FOOTER_COLOR,
        font: PORTFOLIO_DOCX_FONT_FAMILY,
      }),
      new TextRun({
        children: [PageNumber.CURRENT],
        size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
        color: PORTFOLIO_DOCX_FOOTER_COLOR,
        font: PORTFOLIO_DOCX_FONT_FAMILY,
      }),
    ],
  });
}

function buildPortfolioDocumentSection(
  metadata: PortfolioMetadata,
  projects: PortfolioProject[],
): ISectionOptions {
  return {
    children: [
      buildPortfolioTitleParagraph(metadata.title),
      ...buildPortfolioAuthorParagraph(metadata.author),
      ...buildPortfolioDescriptionParagraph(metadata.description),
      ...buildPortfolioContactParagraph(metadata),
      createDivider(PORTFOLIO_DOCX_LINE_COLOR),
      buildPortfolioProjectsHeading(),
      ...projects.flatMap((project, index) => buildPortfolioProjectParagraphs(project, index)),
      buildPortfolioFooter(),
    ],
  };
}

export async function exportPortfolioDocxDocument(
  metadata: PortfolioMetadata,
  projects: PortfolioProject[],
): Promise<Uint8Array> {
  const doc = new Document({
    sections: [buildPortfolioDocumentSection(metadata, projects)],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
