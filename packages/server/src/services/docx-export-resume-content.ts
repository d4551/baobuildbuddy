import type {
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeProject,
  ResumeSkills,
} from "@bao/shared/types/resume";
import { Paragraph, TextRun } from "docx";
import {
  DOCX_RESUME_FONT_ACCENT_PT,
  DOCX_RESUME_FONT_BODY_PT,
  type DocxTemplateConfig,
} from "./docx-export-contracts";

function buildDateLocationParagraph(
  dateParts: string[],
  location: string | undefined,
  config: DocxTemplateConfig,
): Paragraph {
  const locationLine = location ? ` | ${location}` : "";
  return new Paragraph({
    children: [
      new TextRun({
        text: dateParts.join(" – ") + locationLine,
        italics: true,
        size: DOCX_RESUME_FONT_ACCENT_PT * 2,
        color: config.mutedColorHex,
        font: config.fontFamily,
      }),
    ],
    spacing: { after: 40 },
  });
}

function buildAchievementParagraphs(
  achievements: string[] | undefined,
  config: DocxTemplateConfig,
): Paragraph[] {
  if (!achievements || achievements.length === 0) return [];
  return achievements.map(
    (achievement) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: achievement,
            size: DOCX_RESUME_FONT_BODY_PT * 2,
            font: config.fontFamily,
          }),
        ],
      }),
  );
}

export function buildExperienceItem(
  item: ResumeExperienceItem,
  config: DocxTemplateConfig,
): Paragraph[] {
  const items: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: item.title ?? "",
          bold: true,
          size: DOCX_RESUME_FONT_BODY_PT * 2,
          font: config.fontFamily,
        }),
        new TextRun({
          text: item.company ? ` — ${item.company}` : "",
          size: DOCX_RESUME_FONT_BODY_PT * 2,
          color: config.secondaryColorHex,
          font: config.fontFamily,
        }),
      ],
      spacing: { before: 100 },
    }),
  ];

  const dateParts = [item.startDate, item.endDate ?? "Present"].filter(Boolean);
  if (dateParts.length > 0) {
    items.push(buildDateLocationParagraph(dateParts, item.location, config));
  }

  items.push(...buildAchievementParagraphs(item.achievements, config));
  return items;
}

function buildGpaParagraph(gpa: string, config: DocxTemplateConfig): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: "GPA: ",
        bold: true,
        size: DOCX_RESUME_FONT_ACCENT_PT * 2,
        font: config.fontFamily,
      }),
      new TextRun({
        text: gpa,
        size: DOCX_RESUME_FONT_ACCENT_PT * 2,
        font: config.fontFamily,
      }),
    ],
  });
}

export function buildEducationItem(
  item: ResumeEducationItem,
  config: DocxTemplateConfig,
): Paragraph[] {
  const items: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: item.degree ?? "",
          bold: true,
          size: DOCX_RESUME_FONT_BODY_PT * 2,
          font: config.fontFamily,
        }),
        new TextRun({
          text: item.school ? ` — ${item.school}` : "",
          size: DOCX_RESUME_FONT_BODY_PT * 2,
          color: config.secondaryColorHex,
          font: config.fontFamily,
        }),
      ],
      spacing: { before: 100 },
    }),
  ];

  if (item.year) {
    items.push(
      new Paragraph({
        children: [
          new TextRun({
            text: item.year,
            italics: true,
            size: DOCX_RESUME_FONT_ACCENT_PT * 2,
            color: config.mutedColorHex,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 40 },
      }),
    );
  }

  if (item.gpa) {
    items.push(buildGpaParagraph(item.gpa, config));
  }

  return items;
}

function buildSkillParagraph(
  label: string,
  values: string[],
  config: DocxTemplateConfig,
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        size: DOCX_RESUME_FONT_BODY_PT * 2,
        font: config.fontFamily,
      }),
      new TextRun({
        text: values.join(", "),
        size: DOCX_RESUME_FONT_BODY_PT * 2,
        font: config.fontFamily,
      }),
    ],
    spacing: { after: 40 },
  });
}

export function buildSkillsSection(skills: ResumeSkills, config: DocxTemplateConfig): Paragraph[] {
  return [
    { label: "Technical", values: skills.technical },
    { label: "Soft Skills", values: skills.soft },
    { label: "Gaming", values: skills.gaming },
  ].flatMap(({ label, values }) =>
    values && values.length > 0 ? [buildSkillParagraph(label, values, config)] : [],
  );
}

export function buildProjectItem(project: ResumeProject, config: DocxTemplateConfig): Paragraph[] {
  const items: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: project.title ?? "",
          bold: true,
          size: DOCX_RESUME_FONT_BODY_PT * 2,
          font: config.fontFamily,
        }),
      ],
      spacing: { before: 80 },
    }),
  ];

  if (project.description) {
    items.push(
      new Paragraph({
        children: [
          new TextRun({
            text: project.description,
            size: DOCX_RESUME_FONT_BODY_PT * 2,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 40 },
      }),
    );
  }

  if (project.technologies && project.technologies.length > 0) {
    items.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Technologies: ${project.technologies.join(", ")}`,
            italics: true,
            size: DOCX_RESUME_FONT_ACCENT_PT * 2,
            color: config.accentColorHex,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 40 },
      }),
    );
  }

  return items;
}

export function buildGamingExperienceSection(
  gaming: NonNullable<ResumeData["gamingExperience"]>,
  config: DocxTemplateConfig,
): Paragraph[] {
  const items: Paragraph[] = [];
  const entries: Array<{ label: string; value: string | undefined }> = [
    { label: "Game Engines", value: gaming.gameEngines },
    { label: "Platforms", value: gaming.platforms },
    { label: "Genres", value: gaming.genres },
    { label: "Shipped Titles", value: gaming.shippedTitles },
  ];
  for (const entry of entries) {
    if (entry.value) {
      items.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${entry.label}: `,
              bold: true,
              size: DOCX_RESUME_FONT_BODY_PT * 2,
              font: config.fontFamily,
            }),
            new TextRun({
              text: entry.value,
              size: DOCX_RESUME_FONT_BODY_PT * 2,
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }
  }
  return items;
}
