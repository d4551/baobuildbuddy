import {
  COVER_LETTER_EXPORT_THEME,
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
  collectDefinedStringValues,
  formatExportDate,
  PORTFOLIO_EXPORT_THEME,
  type PortfolioMetadata,
  type PortfolioProject,
  RESUME_EXPORT_THEME_CONFIGS,
  RESUME_TEMPLATE_DEFAULT,
  resolveResumeExportTemplate,
  type ResumeData,
  type ResumeTemplate,
  toCoverLetterParagraphs,
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
type DocxTemplateConfig = (typeof RESUME_EXPORT_THEME_CONFIGS)[ResumeTemplate]["docx"];

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

const COVER_LETTER_DOCX_FONT_FAMILY = COVER_LETTER_EXPORT_THEME.docx.fontFamily;
const PORTFOLIO_DOCX_FONT_FAMILY = PORTFOLIO_EXPORT_THEME.docx.fontFamily;
const COVER_LETTER_DOCX_TEXT_COLOR = COVER_LETTER_EXPORT_THEME.docx.textColorHex;
const COVER_LETTER_DOCX_MUTED_COLOR = COVER_LETTER_EXPORT_THEME.docx.mutedColorHex;
const PORTFOLIO_DOCX_PRIMARY_COLOR = PORTFOLIO_EXPORT_THEME.docx.primaryColorHex;
const PORTFOLIO_DOCX_MUTED_COLOR = PORTFOLIO_EXPORT_THEME.docx.mutedColorHex;
const PORTFOLIO_DOCX_SUBTLE_COLOR = PORTFOLIO_EXPORT_THEME.docx.subtleColorHex;
const PORTFOLIO_DOCX_FOOTER_COLOR = PORTFOLIO_EXPORT_THEME.docx.footerColorHex;

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
const createSectionHeading = (
  label: string,
  color: string,
  pt: number,
  fontFamily: string,
): Paragraph =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: label.toUpperCase(),
        bold: true,
        size: pt * 2,
        color,
        font: fontFamily,
      }),
    ],
  });

/**
 * DOCX export service for resumes, cover letters, and portfolios.
 */
export class DocxExportService {
  /**
   * Generates a styled DOCX resume document.
   *
   * @param resume Resume data payload.
   * @param templateName Optional template override.
   * @returns DOCX binary buffer.
   */
  async exportResumeDocx(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    const resolvedTemplate = resolveResumeExportTemplate(templateName, resume.template);
    const config =
      RESUME_EXPORT_THEME_CONFIGS[resolvedTemplate]?.docx ??
      RESUME_EXPORT_THEME_CONFIGS[RESUME_TEMPLATE_DEFAULT].docx;
    const doc = new Document({
      sections: [{ children: this.buildResumeSections(resume, config) }],
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
    const doc = new Document({
      sections: [{ children: this.buildCoverLetterSections(coverLetter, userProfile) }],
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

  private buildResumeSections(resume: ResumeData, config: DocxTemplateConfig): Paragraph[] {
    return [
      ...this.buildResumeHeaderSection(resume.personalInfo, config),
      ...this.buildResumeSummarySection(resume.summary, config),
      ...this.buildResumeExperienceSection(resume.experience, config),
      ...this.buildResumeEducationSection(resume.education, config),
      ...this.buildResumeSkillsSection(resume.skills, config),
      ...this.buildResumeProjectsSection(resume.projects, config),
      ...this.buildResumeGamingSection(resume.gamingExperience, config),
    ];
  }

  private buildResumeHeaderSection(
    personalInfo: ResumeData["personalInfo"],
    config: DocxTemplateConfig,
  ): Paragraph[] {
    const children = personalInfo ? this.buildResumeHeader(personalInfo, config) : [];
    return [...children, createDivider(config.primaryColorHex)];
  }

  private buildResumeSummarySection(
    summary: ResumeData["summary"],
    config: DocxTemplateConfig,
  ): Paragraph[] {
    if (!summary) {
      return [];
    }

    return [
      createSectionHeading("Summary", config.primaryColorHex, DOCX_RESUME_FONT_HEADER_PT, config.fontFamily),
      new Paragraph({
        children: [
          new TextRun({
            text: summary,
            size: DOCX_RESUME_FONT_BODY_PT * 2,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 120 },
      }),
    ];
  }

  private buildResumeExperienceSection(
    experience: ResumeData["experience"],
    config: DocxTemplateConfig,
  ): Paragraph[] {
    if (!(experience && experience.length > 0)) {
      return [];
    }

    return [
      createSectionHeading("Experience", config.primaryColorHex, DOCX_RESUME_FONT_HEADER_PT, config.fontFamily),
      ...experience.flatMap((item) => this.buildExperienceItem(item, config)),
    ];
  }

  private buildResumeEducationSection(
    education: ResumeData["education"],
    config: DocxTemplateConfig,
  ): Paragraph[] {
    if (!(education && education.length > 0)) {
      return [];
    }

    return [
      createSectionHeading("Education", config.primaryColorHex, DOCX_RESUME_FONT_HEADER_PT, config.fontFamily),
      ...education.flatMap((item) => this.buildEducationItem(item, config)),
    ];
  }

  private buildResumeSkillsSection(
    skills: ResumeData["skills"],
    config: DocxTemplateConfig,
  ): Paragraph[] {
    if (!skills) {
      return [];
    }

    return [
      createSectionHeading("Skills", config.primaryColorHex, DOCX_RESUME_FONT_HEADER_PT, config.fontFamily),
      ...this.buildSkillsSection(skills, config),
    ];
  }

  private buildResumeProjectsSection(
    projects: ResumeData["projects"],
    config: DocxTemplateConfig,
  ): Paragraph[] {
    if (!(projects && projects.length > 0)) {
      return [];
    }

    return [
      createSectionHeading("Projects", config.primaryColorHex, DOCX_RESUME_FONT_HEADER_PT, config.fontFamily),
      ...projects.flatMap((project) => this.buildProjectItem(project, config)),
    ];
  }

  private buildResumeGamingSection(
    gamingExperience: ResumeData["gamingExperience"],
    config: DocxTemplateConfig,
  ): Paragraph[] {
    if (!gamingExperience) {
      return [];
    }

    return [
      createSectionHeading("Gaming Experience", config.primaryColorHex, DOCX_RESUME_FONT_HEADER_PT, config.fontFamily),
      ...this.buildGamingExperienceSection(gamingExperience, config),
    ];
  }

  private buildCoverLetterSections(
    coverLetter: CoverLetterPayload,
    userProfile: CoverLetterUserProfile,
  ): Paragraph[] {
    return [
      ...this.buildCoverLetterHeader(userProfile),
      ...this.buildCoverLetterRecipientBlock(coverLetter),
      ...this.buildCoverLetterBodyParagraphs(coverLetter.content),
      ...this.buildCoverLetterSignature(userProfile),
    ];
  }

  private buildCoverLetterHeader(userProfile: CoverLetterUserProfile): Paragraph[] {
    const children = [
      new Paragraph({
        children: [
          new TextRun({
            text: userProfile.name,
            bold: true,
            size: DOCX_COVER_LETTER_FONT_HEADER_PT * 2,
            font: COVER_LETTER_DOCX_FONT_FAMILY,
          }),
        ],
        spacing: { after: 40 },
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
          spacing: { after: 200 },
        }),
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: formatExportDate(new Date()),
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            color: COVER_LETTER_DOCX_TEXT_COLOR,
            font: COVER_LETTER_DOCX_FONT_FAMILY,
          }),
        ],
        spacing: { after: 200 },
      }),
    );

    return children;
  }

  private buildCoverLetterRecipientBlock(coverLetter: CoverLetterPayload): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: coverLetter.company,
            bold: true,
            size: DOCX_COVER_LETTER_FONT_BODY_PT * 2,
            color: COVER_LETTER_DOCX_TEXT_COLOR,
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
            color: COVER_LETTER_DOCX_MUTED_COLOR,
            font: COVER_LETTER_DOCX_FONT_FAMILY,
          }),
        ],
        spacing: { after: 200 },
      }),
    ];
  }

  private buildCoverLetterBodyParagraphs(content: unknown): Paragraph[] {
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

  private buildCoverLetterSignature(userProfile: CoverLetterUserProfile): Paragraph[] {
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
            color: config.primaryColorHex,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 60 },
      }),
    );

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
            color: config.secondaryColorHex,
            font: config.fontFamily,
          }),
        ],
        spacing: { before: 100 },
      }),
    );

    const dateParts = collectDefinedStringValues([item.startDate, item.endDate ?? "Present"]);
    if (dateParts.length > 0) {
      const locationLine = item.location ? ` | ${item.location}` : "";
      items.push(
        new Paragraph({
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
            color: config.secondaryColorHex,
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
              color: config.mutedColorHex,
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
            new TextRun({
              text: "GPA: ",
              bold: true,
              size: DOCX_RESUME_FONT_ACCENT_PT * 2,
              font: config.fontFamily,
            }),
            new TextRun({
              text: item.gpa,
              size: DOCX_RESUME_FONT_ACCENT_PT * 2,
              font: config.fontFamily,
            }),
          ],
        }),
      );
    }

    return items;
  }

  private buildSkillsSection(skills: ResumeSkillsData, config: DocxTemplateConfig): Paragraph[] {
    const skillSections = [
      { label: "Technical", values: skills.technical },
      { label: "Soft Skills", values: skills.soft },
      { label: "Gaming", values: skills.gaming },
    ];

    return skillSections.flatMap(({ label, values }) =>
      values && values.length > 0 ? [this.buildSkillParagraph(label, values, config)] : [],
    );
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
    return {
      children: [
        this.buildPortfolioTitleParagraph(metadata.title),
        ...this.buildPortfolioAuthorParagraph(metadata.author),
        ...this.buildPortfolioDescriptionParagraph(metadata.description),
        ...this.buildPortfolioContactParagraph(metadata),
      ],
    };
  }

  private buildPortfolioProjectsSection(
    _metadata: PortfolioMetadata,
    projects: PortfolioProject[],
  ): ISectionOptions {
    return {
      children: [
        this.buildPortfolioProjectsHeading(),
        ...projects.flatMap((project, index) => this.buildPortfolioProjectParagraphs(project, index)),
        this.buildPortfolioFooter(),
      ],
    };
  }

  private buildSkillParagraph(
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

  private buildPortfolioTitleParagraph(title: string | undefined): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 4000 },
      children: [
        new TextRun({
          text: title ?? "Portfolio",
          bold: true,
          size: DOCX_PORTFOLIO_FONT_TITLE_PT * 2,
          color: PORTFOLIO_DOCX_PRIMARY_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
    });
  }

  private buildPortfolioAuthorParagraph(author: string | undefined): Paragraph[] {
    if (!author) {
      return [];
    }

    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: author,
            size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
            color: PORTFOLIO_DOCX_MUTED_COLOR,
            font: PORTFOLIO_DOCX_FONT_FAMILY,
          }),
        ],
      }),
    ];
  }

  private buildPortfolioDescriptionParagraph(description: string | undefined): Paragraph[] {
    if (!description) {
      return [];
    }

    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: description,
            italics: true,
            size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
            color: PORTFOLIO_DOCX_SUBTLE_COLOR,
            font: PORTFOLIO_DOCX_FONT_FAMILY,
          }),
        ],
      }),
    ];
  }

  private buildPortfolioContactParagraph(metadata: PortfolioMetadata): Paragraph[] {
    const contactParts = collectDefinedStringValues([metadata.website, metadata.email]);
    if (contactParts.length === 0) {
      return [];
    }

    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: contactParts.join(" | "),
            size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
            color: PORTFOLIO_DOCX_PRIMARY_COLOR,
            font: PORTFOLIO_DOCX_FONT_FAMILY,
          }),
        ],
      }),
    ];
  }

  private buildPortfolioProjectsHeading(): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "Projects",
          bold: true,
          size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
          color: PORTFOLIO_DOCX_PRIMARY_COLOR,
          font: PORTFOLIO_DOCX_FONT_FAMILY,
        }),
      ],
      spacing: { after: 200 },
    });
  }

  private buildPortfolioProjectParagraphs(
    project: PortfolioProject,
    index: number,
  ): Paragraph[] {
    const urls = collectDefinedStringValues([project.liveUrl, project.githubUrl]);
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: `${String(index + 1)}. ${project.title}`,
            bold: true,
            size: DOCX_PORTFOLIO_FONT_HEADING_PT * 2,
            color: PORTFOLIO_DOCX_PRIMARY_COLOR,
            font: PORTFOLIO_DOCX_FONT_FAMILY,
          }),
        ],
        spacing: { before: 240 },
      }),
      ...this.buildPortfolioProjectRole(project.role),
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
      ...this.buildPortfolioProjectTechnologies(project.technologies),
      ...this.buildPortfolioProjectTags(project.tags),
      ...this.buildPortfolioProjectUrls(urls),
    ];
  }

  private buildPortfolioProjectRole(role: string | undefined): Paragraph[] {
    if (!role) {
      return [];
    }

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
      }),
    ];
  }

  private buildPortfolioProjectTechnologies(technologies: string[] | undefined): Paragraph[] {
    if (!(technologies && technologies.length > 0)) {
      return [];
    }

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

  private buildPortfolioProjectTags(tags: string[] | undefined): Paragraph[] {
    if (!(tags && tags.length > 0)) {
      return [];
    }

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

  private buildPortfolioProjectUrls(urls: string[]): Paragraph[] {
    if (urls.length === 0) {
      return [];
    }

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: urls.join(" | "),
            size: DOCX_PORTFOLIO_FONT_BODY_PT * 2,
            color: PORTFOLIO_DOCX_PRIMARY_COLOR,
            font: PORTFOLIO_DOCX_FONT_FAMILY,
          }),
        ],
        spacing: { after: 80 },
      }),
    ];
  }

  private buildPortfolioFooter(): Paragraph {
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
}

/**
 * Singleton DOCX export service instance.
 */
export const docxExportService = new DocxExportService();
