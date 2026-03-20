import {
  COVER_LETTER_DEFAULT_SIGNATURE,
  DOCX_COVER_LETTER_FONT_BODY_PT,
  DOCX_COVER_LETTER_FONT_HEADER_PT,
  DOCX_PORTFOLIO_FONT_BODY_PT,
  DOCX_PORTFOLIO_FONT_HEADING_PT,
  DOCX_PORTFOLIO_FONT_TITLE_PT,
  DOCX_RESUME_FONT_ACCENT_PT,
  DOCX_RESUME_FONT_BODY_PT,
  DOCX_RESUME_FONT_HEADER_PT,
  DOCX_RESUME_FONT_NAME_PT,
  EXPORT_DATE_LOCALE,
  isRecord,
  isResumeTemplate,
  type PortfolioMetadata,
  type PortfolioProject,
  RESUME_TEMPLATE_DEFAULT,
  type ResumeData,
  type ResumeTemplate,
} from "@bao/shared";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  type ISectionOptions,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";

type ResumeExperienceItem = NonNullable<ResumeData["experience"]>[number];
type ResumeEducationItem = NonNullable<ResumeData["education"]>[number];
type ResumeProjectItem = NonNullable<ResumeData["projects"]>[number];
type ResumeSkillsData = NonNullable<ResumeData["skills"]>;
type ResumePersonalInfo = NonNullable<ResumeData["personalInfo"]>;

interface DocxTemplateConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

interface CoverLetterPayload {
  company: string;
  position: string;
  content: unknown;
}

interface CoverLetterUserProfile {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
}

const COVER_LETTER_DATE_FORMATTER = new Intl.DateTimeFormat(EXPORT_DATE_LOCALE, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const DOCX_TEMPLATE_CONFIGS: Record<ResumeTemplate, DocxTemplateConfig> = {
  modern: {
    primaryColor: "2962FF",
    accentColor: "009688",
    fontFamily: "Calibri",
  },
  classic: {
    primaryColor: "333333",
    accentColor: "555555",
    fontFamily: "Times New Roman",
  },
  creative: {
    primaryColor: "E91E63",
    accentColor: "FF9800",
    fontFamily: "Georgia",
  },
  minimal: {
    primaryColor: "424242",
    accentColor: "757575",
    fontFamily: "Calibri",
  },
  "google-xyz": {
    primaryColor: "4285F4",
    accentColor: "34A853",
    fontFamily: "Calibri",
  },
  gaming: {
    primaryColor: "8A2BE2",
    accentColor: "FF0064",
    fontFamily: "Consolas",
  },
  executive: {
    primaryColor: "1A237E",
    accentColor: "C9B037",
    fontFamily: "Garamond",
  },
  technical: {
    primaryColor: "00695C",
    accentColor: "0277BD",
    fontFamily: "Consolas",
  },
};

const asStringParagraphs = (value: unknown): string[] => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const toCoverLetterParagraphs = (content: unknown): string[] => {
  if (typeof content === "string") {
    return content
      .split("\n\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (!isRecord(content)) {
    return [];
  }
  const canonical = [
    ...asStringParagraphs(content.opening),
    ...asStringParagraphs(content.body),
    ...asStringParagraphs(content.closing),
  ];
  if (canonical.length > 0) {
    return canonical;
  }
  return [
    ...asStringParagraphs(content.introduction),
    ...asStringParagraphs(content.main),
    ...asStringParagraphs(content.conclusion),
  ];
};

const collectDefinedValues = (values: Array<string | undefined>): string[] =>
  values.filter((v): v is string => typeof v === "string" && v.trim().length > 0);

/**
 * Horizontal separator paragraph for resume DOCX output.
 */
const createDivider = (color: string): Paragraph =>
  new Paragraph({
    spacing: { before: 100, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color },
    },
  });

/**
 * Section heading paragraph for resume DOCX output.
 */
const createSectionHeading = (label: string, color: string, pt: number): Paragraph =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: label.toUpperCase(),
        bold: true,
        size: pt * 2,
        color,
        font: "Calibri",
      }),
    ],
  });

/**
 * DOCX export service for resumes, cover letters, and portfolios.
 */
export class DocxExportService {
  /**
   * Resolves the template name from user or resume-level values.
   */
  private resolveTemplate(templateName?: string, resumeTemplate?: string): ResumeTemplate {
    if (isResumeTemplate(templateName)) {
      return templateName;
    }
    if (isResumeTemplate(resumeTemplate)) {
      return resumeTemplate;
    }
    return RESUME_TEMPLATE_DEFAULT;
  }

  /**
   * Generates a styled DOCX resume document.
   *
   * @param resume Resume data payload.
   * @param templateName Optional template override.
   * @returns DOCX binary buffer.
   */
  async exportResumeDocx(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    const resolvedTemplate = this.resolveTemplate(templateName, resume.template);
    const config = DOCX_TEMPLATE_CONFIGS[resolvedTemplate];
    const children: Paragraph[] = [];

    const personalInfo = resume.personalInfo;
    if (personalInfo) {
      children.push(...this.buildResumeHeader(personalInfo, config));
    }

    children.push(createDivider(config.primaryColor));

    if (resume.summary) {
      children.push(createSectionHeading("Summary", config.primaryColor, DOCX_RESUME_FONT_HEADER_PT));
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resume.summary,
              size: DOCX_RESUME_FONT_BODY_PT * 2,
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 120 },
        }),
      );
    }

    if (resume.experience && resume.experience.length > 0) {
      children.push(createSectionHeading("Experience", config.primaryColor, DOCX_RESUME_FONT_HEADER_PT));
      for (const item of resume.experience) {
        children.push(...this.buildExperienceItem(item, config));
      }
    }

    if (resume.education && resume.education.length > 0) {
      children.push(createSectionHeading("Education", config.primaryColor, DOCX_RESUME_FONT_HEADER_PT));
      for (const item of resume.education) {
        children.push(...this.buildEducationItem(item, config));
      }
    }

    if (resume.skills) {
      children.push(createSectionHeading("Skills", config.primaryColor, DOCX_RESUME_FONT_HEADER_PT));
      children.push(...this.buildSkillsSection(resume.skills, config));
    }

    if (resume.projects && resume.projects.length > 0) {
      children.push(createSectionHeading("Projects", config.primaryColor, DOCX_RESUME_FONT_HEADER_PT));
      for (const project of resume.projects) {
        children.push(...this.buildProjectItem(project, config));
      }
    }

    if (resume.gamingExperience) {
      children.push(
        createSectionHeading("Gaming Experience", config.primaryColor, DOCX_RESUME_FONT_HEADER_PT),
      );
      children.push(...this.buildGamingExperienceSection(resume.gamingExperience, config));
    }

    const doc = new Document({
      sections: [{ children }],
    });
    const buffer = await Packer.toBuffer(doc);
    return new Uint8Array(buffer);
  }

  /**
   * Generates a styled DOCX cover letter document.
   *
   * @param coverLetter Cover letter data payload.
   * @param userProfile Sender profile for header.
   * @returns DOCX binary buffer.
   */
  async exportCoverLetterDocx(
    coverLetter: CoverLetterPayload,
    userProfile: CoverLetterUserProfile,
  ): Promise<Uint8Array> {
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userProfile.name,
            bold: true,
            size: DOCX_COVER_LETTER_FONT_HEADER_PT * 2,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 40 },
      }),
    );

    const contactParts = collectDefinedValues([
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
              color: "666666",
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 200 },
        }),
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: COVER_LETTER_DATE_FORMATTER.format(new Date()),
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 200 },
      }),
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: coverLetter.company,
            bold: true,
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            font: "Times New Roman",
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Re: ${coverLetter.position}`,
            italics: true,
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 200 },
      }),
    );

    const paragraphs = toCoverLetterParagraphs(coverLetter.content);
    for (const paragraph of paragraphs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraph,
              size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 160 },
        }),
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: COVER_LETTER_DEFAULT_SIGNATURE,
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            font: "Times New Roman",
          }),
        ],
        spacing: { before: 200, after: 40 },
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userProfile.name,
            bold: true,
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            font: "Times New Roman",
          }),
        ],
      }),
    );

    const doc = new Document({
      sections: [{ children }],
    });
    const buffer = await Packer.toBuffer(doc);
    return new Uint8Array(buffer);
  }

  /**
   * Generates a styled DOCX portfolio document with project showcase.
   *
   * @param metadata Portfolio metadata (title, author, description, etc.).
   * @param projects Portfolio project list.
   * @returns DOCX binary buffer.
   */
  async exportPortfolioDocx(
    metadata: PortfolioMetadata,
    projects: PortfolioProject[],
  ): Promise<Uint8Array> {
    const coverSection = this.buildPortfolioCoverPage(metadata);
    const projectSection = this.buildPortfolioProjectsSection(metadata, projects);

    const doc = new Document({
      sections: [coverSection, projectSection],
    });
    const buffer = await Packer.toBuffer(doc);
    return new Uint8Array(buffer);
  }

  private buildResumeHeader(info: ResumePersonalInfo, config: DocxTemplateConfig): Paragraph[] {
    const items: Paragraph[] = [];

    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: info.name ?? "",
            bold: true,
            size: DOCX_RESUME_FONT_NAME_PT * 2,
            color: config.primaryColor,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 60 },
      }),
    );

    const contactParts = collectDefinedValues([info.email, info.phone, info.location]);
    if (contactParts.length > 0) {
      items.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: contactParts.join(" | "),
              size: DOCX_RESUME_FONT_ACCENT_PT * 2,
              color: "666666",
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    const linkParts = collectDefinedValues([info.linkedIn, info.portfolio, info.github]);
    if (linkParts.length > 0) {
      items.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: linkParts.join(" | "),
              size: DOCX_RESUME_FONT_ACCENT_PT * 2,
              color: config.accentColor,
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 60 },
        }),
      );
    }

    return items;
  }

  private buildExperienceItem(item: ResumeExperienceItem, config: DocxTemplateConfig): Paragraph[] {
    const items: Paragraph[] = [];

    items.push(
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
            color: "666666",
            font: config.fontFamily,
          }),
        ],
        spacing: { before: 100 },
      }),
    );

    const dateParts = collectDefinedValues([item.startDate, item.endDate ?? "Present"]);
    if (dateParts.length > 0) {
      const locationLine = item.location ? ` | ${item.location}` : "";
      items.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dateParts.join(" – ") + locationLine,
              italics: true,
              size: DOCX_RESUME_FONT_ACCENT_PT * 2,
              color: "999999",
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    if (item.achievements && item.achievements.length > 0) {
      for (const achievement of item.achievements) {
        items.push(
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
    }

    return items;
  }

  private buildEducationItem(item: ResumeEducationItem, config: DocxTemplateConfig): Paragraph[] {
    const items: Paragraph[] = [];

    items.push(
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
            color: "666666",
            font: config.fontFamily,
          }),
        ],
        spacing: { before: 100 },
      }),
    );

    if (item.year) {
      items.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item.year,
              italics: true,
              size: DOCX_RESUME_FONT_ACCENT_PT * 2,
              color: "999999",
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    if (item.gpa) {
      items.push(
        new Paragraph({
          children: [
            new TextRun({ text: "GPA: ", bold: true, size: DOCX_RESUME_FONT_ACCENT_PT * 2, font: config.fontFamily }),
            new TextRun({ text: item.gpa, size: DOCX_RESUME_FONT_ACCENT_PT * 2, font: config.fontFamily }),
          ],
        }),
      );
    }

    return items;
  }

  private buildSkillsSection(skills: ResumeSkillsData, config: DocxTemplateConfig): Paragraph[] {
    const items: Paragraph[] = [];

    if (skills.technical && skills.technical.length > 0) {
      items.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Technical: ", bold: true, size: DOCX_RESUME_FONT_BODY_PT * 2, font: config.fontFamily }),
            new TextRun({
              text: skills.technical.join(", "),
              size: DOCX_RESUME_FONT_BODY_PT * 2,
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    if (skills.soft && skills.soft.length > 0) {
      items.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Soft Skills: ", bold: true, size: DOCX_RESUME_FONT_BODY_PT * 2, font: config.fontFamily }),
            new TextRun({
              text: skills.soft.join(", "),
              size: DOCX_RESUME_FONT_BODY_PT * 2,
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    if (skills.gaming && skills.gaming.length > 0) {
      items.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Gaming: ", bold: true, size: DOCX_RESUME_FONT_BODY_PT * 2, font: config.fontFamily }),
            new TextRun({
              text: skills.gaming.join(", "),
              size: DOCX_RESUME_FONT_BODY_PT * 2,
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    return items;
  }

  private buildProjectItem(project: ResumeProjectItem, config: DocxTemplateConfig): Paragraph[] {
    const items: Paragraph[] = [];

    items.push(
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
    );

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
              color: config.accentColor,
              font: config.fontFamily,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    return items;
  }

  private buildGamingExperienceSection(
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

  private buildPortfolioCoverPage(metadata: PortfolioMetadata): ISectionOptions {
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 4000 },
        children: [
          new TextRun({
            text: metadata.title ?? "Portfolio",
            bold: true,
            size: DOCX_PORTFOLIO_FONT_TITLE_PT * 2,
            color: "333399",
            font: "Calibri",
          }),
        ],
      }),
    );

    if (metadata.author) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [
            new TextRun({
              text: metadata.author,
              size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
              color: "666666",
              font: "Calibri",
            }),
          ],
        }),
      );
    }

    if (metadata.description) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: metadata.description,
              italics: true,
              size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
              color: "999999",
              font: "Calibri",
            }),
          ],
        }),
      );
    }

    const contactParts = collectDefinedValues([metadata.website, metadata.email]);
    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: contactParts.join(" | "),
              size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
              color: "333399",
              font: "Calibri",
            }),
          ],
        }),
      );
    }

    return { children };
  }

  private buildPortfolioProjectsSection(
    _metadata: PortfolioMetadata,
    projects: PortfolioProject[],
  ): ISectionOptions {
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: "Projects",
            bold: true,
            size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
            color: "333399",
            font: "Calibri",
          }),
        ],
        spacing: { after: 200 },
      }),
    );

    for (let idx = 0; idx < projects.length; idx++) {
      const project = projects[idx];

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${String(idx + 1)}. ${project.title}`,
              bold: true,
              size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
              color: "333399",
              font: "Calibri",
            }),
          ],
          spacing: { before: 240 },
        }),
      );

      if (project.role) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Role: ${project.role}`,
                italics: true,
                size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
                color: "666666",
                font: "Calibri",
              }),
            ],
          }),
        );
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.description,
              size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
              font: "Calibri",
            }),
          ],
          spacing: { after: 80 },
        }),
      );

      if (project.technologies && project.technologies.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Technologies: ",
                bold: true,
                size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
                font: "Calibri",
              }),
              new TextRun({
                text: project.technologies.join(", "),
                size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
                font: "Calibri",
              }),
            ],
            spacing: { after: 40 },
          }),
        );
      }

      if (project.tags && project.tags.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Tags: ${project.tags.join(", ")}`,
                italics: true,
                size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
                color: "999999",
                font: "Calibri",
              }),
            ],
            spacing: { after: 40 },
          }),
        );
      }

      const urls = collectDefinedValues([project.liveUrl, project.githubUrl]);
      if (urls.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: urls.join(" | "),
                size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
                color: "333399",
                font: "Calibri",
              }),
            ],
            spacing: { after: 80 },
          }),
        );
      }
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: "Page ",
            size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
            color: "999999",
            font: "Calibri",
          }),
        ],
      }),
    );

    return { children };
  }
}

/**
 * Singleton DOCX export service instance.
 */
export const docxExportService = new DocxExportService();
