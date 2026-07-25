import { resolvePortfolioDocxTheme } from "@bao/shared/constants/export-document-theme";
import { COUNT_EIGHT } from "@bao/shared/constants/numeric";
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
  type PortfolioDocxTheme,
} from "./docx-export-contracts";

function buildPortfolioTitleParagraph(
  title: string | undefined,
  theme: PortfolioDocxTheme,
): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: title ?? "Portfolio",
        bold: true,
        size: (DOCX_PORTFOLIO_FONT_TITLE_PT - COUNT_EIGHT) * 2,
        color: theme.primaryColorHex,
        font: theme.fontFamily,
      }),
    ],
  });
}

function buildPortfolioAuthorParagraph(
  author: string | undefined,
  theme: PortfolioDocxTheme,
): Paragraph[] {
  if (!author) return [];
  return [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: author,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: theme.mutedColorHex,
          font: theme.fontFamily,
        }),
      ],
    }),
  ];
}

function buildPortfolioDescriptionParagraph(
  metadata: PortfolioMetadata,
  theme: PortfolioDocxTheme,
): Paragraph[] {
  const description = metadata.description ?? metadata.bio;
  if (!description) return [];
  return [
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: description,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: theme.subtleColorHex,
          font: theme.fontFamily,
        }),
      ],
    }),
  ];
}

function buildPortfolioContactParagraph(
  metadata: PortfolioMetadata,
  theme: PortfolioDocxTheme,
): Paragraph[] {
  const contactParts = collectDefinedStringValues([metadata.website, metadata.email]);
  if (contactParts.length === 0) return [];
  return [
    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: contactParts.join(" | "),
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: theme.accentColorHex,
          font: theme.fontFamily,
        }),
      ],
    }),
  ];
}

function buildPortfolioProjectsHeading(theme: PortfolioDocxTheme): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun({
        text: "Selected Case Studies",
        bold: true,
        size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
        color: theme.primaryColorHex,
        font: theme.fontFamily,
      }),
    ],
    spacing: { before: 120, after: 120 },
  });
}

function buildPortfolioProjectRole(
  role: string | undefined,
  theme: PortfolioDocxTheme,
): Paragraph[] {
  if (!role) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `Role: ${role}`,
          italics: true,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: theme.mutedColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];
}

function buildPortfolioProjectTechnologies(
  technologies: string[] | undefined,
  theme: PortfolioDocxTheme,
): Paragraph[] {
  if (!(technologies && technologies.length > 0)) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Technologies: ",
          bold: true,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          font: theme.fontFamily,
        }),
        new TextRun({
          text: technologies.join(", "),
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];
}

function buildPortfolioProjectTags(
  tags: string[] | undefined,
  theme: PortfolioDocxTheme,
): Paragraph[] {
  if (!(tags && tags.length > 0)) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `Tags: ${tags.join(", ")}`,
          italics: true,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: theme.subtleColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];
}

function buildPortfolioProjectUrls(urls: string[], theme: PortfolioDocxTheme): Paragraph[] {
  if (urls.length === 0) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: urls.join(" | "),
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: theme.accentColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 80 },
    }),
  ];
}

function buildPortfolioProjectParagraphs(
  project: PortfolioProject,
  index: number,
  theme: PortfolioDocxTheme,
): Paragraph[] {
  const urls = collectDefinedStringValues([project.liveUrl, project.githubUrl]);
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `CASE STUDY ${index + 1}`,
          bold: true,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          color: theme.accentColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { before: 200, after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${String(index + 1)}. ${project.title}`,
          bold: true,
          size: (DOCX_PORTFOLIO_FONT_HEADING_PT - 1) * 2,
          color: theme.primaryColorHex,
          font: theme.fontFamily,
        }),
      ],
      spacing: { before: 200, after: 20 },
    }),
    ...buildPortfolioProjectRole(project.role, theme),
    new Paragraph({
      children: [
        new TextRun({
          text: project.description,
          size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
          font: theme.fontFamily,
        }),
      ],
      spacing: { after: 80 },
    }),
    ...buildPortfolioProjectTechnologies(project.technologies, theme),
    ...buildPortfolioProjectTags(project.tags, theme),
    ...buildPortfolioProjectUrls(urls, theme),
    createDivider(theme.lineColorHex),
  ];
}

function buildPortfolioFooter(theme: PortfolioDocxTheme): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [
      new TextRun({
        text: "Page ",
        size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
        color: theme.footerColorHex,
        font: theme.fontFamily,
      }),
      new TextRun({
        children: [PageNumber.CURRENT],
        size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
        color: theme.footerColorHex,
        font: theme.fontFamily,
      }),
    ],
  });
}

function buildPortfolioDocumentSection(
  metadata: PortfolioMetadata,
  projects: PortfolioProject[],
  theme: PortfolioDocxTheme,
): ISectionOptions {
  return {
    children: [
      buildPortfolioTitleParagraph(metadata.title, theme),
      ...buildPortfolioAuthorParagraph(metadata.author, theme),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: "CASE STUDIES FOR GAME INDUSTRY HIRING",
            bold: true,
            size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
            color: theme.accentColorHex,
            font: theme.fontFamily,
          }),
        ],
      }),
      ...buildPortfolioDescriptionParagraph(metadata, theme),
      ...buildPortfolioContactParagraph(metadata, theme),
      createDivider(theme.lineColorHex),
      buildPortfolioProjectsHeading(theme),
      ...projects.flatMap((project, index) =>
        buildPortfolioProjectParagraphs(project, index, theme),
      ),
      buildPortfolioFooter(theme),
    ],
  };
}

export async function exportPortfolioDocxDocument(
  metadata: PortfolioMetadata,
  projects: PortfolioProject[],
  template?: string,
): Promise<Uint8Array> {
  const theme = resolvePortfolioDocxTheme(template);
  const doc = new Document({
    sections: [buildPortfolioDocumentSection(metadata, projects, theme)],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
