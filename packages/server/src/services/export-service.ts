import {
  isResumeTemplate,
  type PortfolioMetadata,
  type PortfolioProject,
  RESUME_TEMPLATE_DEFAULT,
  type ResumeData,
  type ResumeTemplate,
} from "@bao/shared";
import {
  type Color,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ResumeTemplateDefinition {
  name: string;
  fonts: { name: number; header: number; body: number; accent: number };
  colors: { primary: RGB; secondary: RGB; accent: RGB; text: RGB; bg: RGB };
  spacing: {
    sectionGap: number;
    lineHeight: number;
    margins: { top: number; right: number; bottom: number; left: number };
  };
  layout: {
    headerStyle: "centered" | "left-aligned" | "banner";
    dividerStyle: "line" | "none" | "accent-bar";
    skillsLayout: "2-column" | "inline-tags" | "grouped";
  };
}

type ResumeExperienceItem = NonNullable<ResumeData["experience"]>[number];
type ResumeEducationItem = NonNullable<ResumeData["education"]>[number];
type ResumeProjectItem = NonNullable<ResumeData["projects"]>[number];
type ResumeSkillsData = NonNullable<ResumeData["skills"]>;
type ResumePersonalInfo = NonNullable<ResumeData["personalInfo"]>;

interface WrappedTextOptions {
  text: string;
  x: number;
  size: number;
  color: Color;
  font: PDFFont;
  maxWidth: number;
  lineGap?: number;
}

interface ResumeRenderContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  yPosition: number;
  fonts: ResumeTemplateDefinition["fonts"];
  layout: ResumeTemplateDefinition["layout"];
  palette: { primary: Color; text: Color; line: Color; accent: Color };
  background: RGB;
  font: PDFFont;
  boldFont: PDFFont;
}

interface ResumeSkillGroupOptions {
  label: string | null;
  items: string[] | undefined;
  separator: string;
  labelColor: Color;
  trailingGap: number;
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

interface CoverLetterRenderContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  yPosition: number;
  font: PDFFont;
  boldFont: PDFFont;
}

interface PortfolioRenderContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  yPosition: number;
  font: PDFFont;
  boldFont: PDFFont;
}

const A4_PAGE_SIZE: [number, number] = [595.28, 841.89];
const [A4_PAGE_WIDTH, A4_PAGE_HEIGHT] = A4_PAGE_SIZE;

const RESUME_SECTION_SPACE = 60;
const RESUME_BODY_LINE_GAP = 4;
const RESUME_HEADER_NAME_SPACING = 30;
const RESUME_CONTACT_SPACING = 15;
const RESUME_LINKS_SPACING = 25;
const RESUME_DIVIDER_SPACING = 20;
const RESUME_SECTION_HEADER_SPACING = 18;

const COVER_LETTER_MARGIN = 60;
const COVER_LETTER_PARAGRAPH_SIZE = 11;
const COVER_LETTER_LINE_HEIGHT = 16;
const COVER_LETTER_PARAGRAPH_GAP = 10;
const COVER_LETTER_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const PORTFOLIO_MARGIN = 50;
const PORTFOLIO_PROJECT_SPACE = 100;
const PORTFOLIO_FOOTER_Y = 30;
const PORTFOLIO_FOOTER_X_OFFSET = 30;

const COVER_LETTER_COLORS = {
  text: rgb(0.15, 0.15, 0.15),
  muted: rgb(0.3, 0.3, 0.3),
  subtle: rgb(0.4, 0.4, 0.4),
};

const PORTFOLIO_COLORS = {
  primary: rgb(0.2, 0.1, 0.5),
  text: rgb(0.2, 0.2, 0.2),
  accent: rgb(0.5, 0.2, 0.6),
  muted: rgb(0.4, 0.4, 0.4),
  featured: rgb(0.8, 0.6, 0),
  line: rgb(0.8, 0.8, 0.8),
  footer: rgb(0.5, 0.5, 0.5),
};

const RESUME_TEMPLATES: Partial<Record<ResumeTemplate, ResumeTemplateDefinition>> = {
  modern: {
    name: "Modern",
    fonts: { name: 24, header: 14, body: 10.5, accent: 9 },
    colors: {
      primary: { r: 0.16, g: 0.38, b: 1.0 }, // #2962FF blue
      secondary: { r: 0.39, g: 0.39, b: 0.39 }, // #646464 gray
      accent: { r: 0, g: 0.59, b: 0.53 }, // #009688 teal
      text: { r: 0.13, g: 0.13, b: 0.13 }, // #212121 dark
      bg: { r: 1, g: 1, b: 1 }, // white
    },
    spacing: {
      sectionGap: 16,
      lineHeight: 1.4,
      margins: { top: 50, right: 50, bottom: 50, left: 50 },
    },
    layout: { headerStyle: "left-aligned", dividerStyle: "line", skillsLayout: "2-column" },
  },
  "google-xyz": {
    name: "Google XYZ",
    fonts: { name: 18, header: 12, body: 10, accent: 8.5 },
    colors: {
      primary: { r: 0.26, g: 0.52, b: 0.96 }, // #4285F4 Google blue
      secondary: { r: 0.37, g: 0.39, b: 0.41 }, // #5F6368
      accent: { r: 0.2, g: 0.66, b: 0.33 }, // #34A853 Google green
      text: { r: 0.13, g: 0.13, b: 0.14 }, // #202124
      bg: { r: 1, g: 1, b: 1 },
    },
    spacing: {
      sectionGap: 12,
      lineHeight: 1.2,
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
    },
    layout: { headerStyle: "left-aligned", dividerStyle: "none", skillsLayout: "inline-tags" },
  },
  gaming: {
    name: "Gaming",
    fonts: { name: 28, header: 16, body: 10.5, accent: 9 },
    colors: {
      primary: { r: 0.54, g: 0.17, b: 0.89 }, // #8A2BE2 purple
      secondary: { r: 0, g: 1.0, b: 0.53 }, // #00FF88 neon green
      accent: { r: 1.0, g: 0, b: 0.39 }, // #FF0064 hot pink
      text: { r: 0.94, g: 0.94, b: 0.94 }, // #F0F0F0 light
      bg: { r: 0.1, g: 0.1, b: 0.14 }, // #191923 dark bg
    },
    spacing: {
      sectionGap: 18,
      lineHeight: 1.3,
      margins: { top: 40, right: 40, bottom: 40, left: 40 },
    },
    layout: { headerStyle: "banner", dividerStyle: "accent-bar", skillsLayout: "grouped" },
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

  if (typeof content !== "object" || content === null || Array.isArray(content)) {
    return [];
  }

  const contentRecord = content as Record<string, unknown>;
  const canonicalParagraphs = [
    ...asStringParagraphs(contentRecord.opening),
    ...asStringParagraphs(contentRecord.body),
    ...asStringParagraphs(contentRecord.closing),
  ];

  if (canonicalParagraphs.length > 0) {
    return canonicalParagraphs;
  }

  return [
    ...asStringParagraphs(contentRecord.introduction),
    ...asStringParagraphs(contentRecord.main),
    ...asStringParagraphs(contentRecord.conclusion),
  ];
};

/**
 * PDF export service for resumes, cover letters, and portfolios.
 */
export class ExportService {
  private resolveTemplate(templateName?: string, resumeTemplate?: string): ResumeTemplate {
    if (isResumeTemplate(templateName)) {
      return templateName;
    }
    if (isResumeTemplate(resumeTemplate)) {
      return resumeTemplate;
    }
    return RESUME_TEMPLATE_DEFAULT;
  }

  private addA4Page(pdfDoc: PDFDocument): PDFPage {
    return pdfDoc.addPage([...A4_PAGE_SIZE]);
  }

  private toPdfColor(color: RGB): Color {
    return rgb(color.r, color.g, color.b);
  }

  private collectDefinedValues(values: Array<string | undefined>): string[] {
    return values.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
  }

  private applyResumeBackground(context: ResumeRenderContext, page: PDFPage): void {
    if (context.background.r >= 0.5) {
      return;
    }

    page.drawRectangle({
      x: 0,
      y: 0,
      width: A4_PAGE_WIDTH,
      height: A4_PAGE_HEIGHT,
      color: this.toPdfColor(context.background),
    });
  }

  private ensureResumeSpace(context: ResumeRenderContext, requiredSpace: number): void {
    if (context.yPosition - requiredSpace >= context.margin) {
      return;
    }

    context.page = this.addA4Page(context.pdfDoc);
    this.applyResumeBackground(context, context.page);
    context.yPosition = context.height - context.margin;
  }

  private drawResumeWrappedLine(
    context: ResumeRenderContext,
    options: WrappedTextOptions,
    line: string,
  ): void {
    const lineGap = options.lineGap ?? RESUME_BODY_LINE_GAP;
    this.ensureResumeSpace(context, options.size + lineGap);
    context.page.drawText(line, {
      x: options.x,
      y: context.yPosition,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    context.yPosition -= options.size + lineGap;
  }

  private drawResumeWrappedText(context: ResumeRenderContext, options: WrappedTextOptions): void {
    const words = options.text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = `${line}${word} `;
      const testWidth = options.font.widthOfTextAtSize(testLine, options.size);
      if (testWidth > options.maxWidth && line.length > 0) {
        this.drawResumeWrappedLine(context, options, line.trim());
        line = `${word} `;
        continue;
      }
      line = testLine;
    }

    if (line.trim().length > 0) {
      this.drawResumeWrappedLine(context, options, line.trim());
    }
  }

  private async createResumeContext(template: ResumeTemplateDefinition): Promise<ResumeRenderContext> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = this.addA4Page(pdfDoc);
    const { width, height } = page.getSize();

    const context: ResumeRenderContext = {
      pdfDoc,
      page,
      width,
      height,
      margin: template.spacing.margins.left,
      yPosition: height - template.spacing.margins.left,
      fonts: template.fonts,
      layout: template.layout,
      palette: {
        primary: this.toPdfColor(template.colors.primary),
        text: this.toPdfColor(template.colors.text),
        line: this.toPdfColor(template.colors.secondary),
        accent: this.toPdfColor(template.colors.accent),
      },
      background: template.colors.bg,
      font,
      boldFont,
    };

    this.applyResumeBackground(context, page);
    return context;
  }

  private renderResumeSectionHeader(context: ResumeRenderContext, title: string): void {
    this.ensureResumeSpace(context, RESUME_SECTION_SPACE);
    context.page.drawText(title, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.header,
      font: context.boldFont,
      color: context.palette.primary,
    });
    context.yPosition -= RESUME_SECTION_HEADER_SPACING;
  }

  private renderResumeName(context: ResumeRenderContext, name: string): void {
    if (context.layout.headerStyle === "banner") {
      context.page.drawRectangle({
        x: 0,
        y: context.yPosition - 10,
        width: A4_PAGE_WIDTH,
        height: context.fonts.name + 20,
        color: context.palette.primary,
      });
      context.page.drawText(name, {
        x: context.width / 2 - context.font.widthOfTextAtSize(name, context.fonts.name) / 2,
        y: context.yPosition,
        size: context.fonts.name,
        font: context.boldFont,
        color: this.toPdfColor(context.background),
      });
      return;
    }

    if (context.layout.headerStyle === "centered") {
      context.page.drawText(name, {
        x: context.width / 2 - context.font.widthOfTextAtSize(name, context.fonts.name) / 2,
        y: context.yPosition,
        size: context.fonts.name,
        font: context.boldFont,
        color: context.palette.primary,
      });
      return;
    }

    context.page.drawText(name, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.name,
      font: context.boldFont,
      color: context.palette.primary,
    });
  }

  private renderResumeContact(context: ResumeRenderContext, info?: ResumePersonalInfo): void {
    const contactItems = this.collectDefinedValues([info?.email, info?.phone, info?.location]);
    if (contactItems.length === 0) {
      return;
    }

    context.page.drawText(contactItems.join(" | "), {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.body,
      font: context.font,
      color: context.palette.text,
    });
    context.yPosition -= RESUME_CONTACT_SPACING;
  }

  private renderResumeLinks(context: ResumeRenderContext, info?: ResumePersonalInfo): void {
    const linkItems = this.collectDefinedValues([info?.website, info?.linkedIn, info?.github]);
    if (linkItems.length === 0) {
      return;
    }

    context.page.drawText(linkItems.join(" | "), {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.accent,
      font: context.font,
      color: context.palette.accent,
    });
    context.yPosition -= RESUME_LINKS_SPACING;
  }

  private renderResumeDivider(context: ResumeRenderContext): void {
    if (context.layout.dividerStyle === "line") {
      context.page.drawLine({
        start: { x: context.margin, y: context.yPosition },
        end: { x: context.width - context.margin, y: context.yPosition },
        thickness: 1,
        color: context.palette.line,
      });
      context.yPosition -= RESUME_DIVIDER_SPACING;
      return;
    }

    if (context.layout.dividerStyle === "accent-bar") {
      context.page.drawRectangle({
        x: context.margin,
        y: context.yPosition - 3,
        width: context.width - context.margin * 2,
        height: 5,
        color: context.palette.accent,
      });
      context.yPosition -= RESUME_DIVIDER_SPACING;
      return;
    }

    context.yPosition -= 10;
  }

  private renderResumeHeader(context: ResumeRenderContext, resume: ResumeData): void {
    const name = resume.personalInfo?.name;
    if (name) {
      this.renderResumeName(context, name);
      context.yPosition -= RESUME_HEADER_NAME_SPACING;
    }

    this.renderResumeContact(context, resume.personalInfo);
    this.renderResumeLinks(context, resume.personalInfo);
    this.renderResumeDivider(context);
  }

  private renderResumeSummary(context: ResumeRenderContext, resume: ResumeData): void {
    if (!resume.summary) {
      return;
    }

    this.renderResumeSectionHeader(context, "SUMMARY");
    this.drawResumeWrappedText(context, {
      text: resume.summary,
      x: context.margin,
      size: context.fonts.body,
      color: context.palette.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2,
    });
    context.yPosition -= 10;
  }

  private renderResumeExperienceDate(context: ResumeRenderContext, experience: ResumeExperienceItem): void {
    const dateLabel = experience.endDate
      ? `${experience.startDate} - ${experience.endDate}`
      : `${experience.startDate} - Present`;
    const locationLabel = experience.location ? `${experience.location} | ${dateLabel}` : dateLabel;

    context.page.drawText(locationLabel, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.accent,
      font: context.font,
      color: context.palette.line,
    });
    context.yPosition -= 15;
  }

  private renderResumeExperienceDescription(
    context: ResumeRenderContext,
    description?: string,
  ): void {
    if (!description) {
      return;
    }

    this.drawResumeWrappedText(context, {
      text: description,
      x: context.margin,
      size: context.fonts.body,
      color: context.palette.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2,
    });
    context.yPosition -= 5;
  }

  private renderResumeExperienceAchievements(
    context: ResumeRenderContext,
    achievements?: string[],
  ): void {
    if (!Array.isArray(achievements) || achievements.length === 0) {
      return;
    }

    for (const achievement of achievements) {
      this.ensureResumeSpace(context, 30);
      context.page.drawText("•", {
        x: context.margin,
        y: context.yPosition,
        size: context.fonts.body,
        font: context.font,
        color: context.palette.text,
      });
      this.drawResumeWrappedText(context, {
        text: achievement,
        x: context.margin + 15,
        size: context.fonts.body,
        color: context.palette.text,
        font: context.font,
        maxWidth: context.width - context.margin * 2 - 15,
      });
      context.yPosition -= 3;
    }
  }

  private renderResumeExperienceTechnologies(
    context: ResumeRenderContext,
    technologies?: string[],
  ): void {
    if (!Array.isArray(technologies) || technologies.length === 0) {
      return;
    }

    this.ensureResumeSpace(context, 20);
    context.page.drawText(`Technologies: ${technologies.join(", ")}`, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.accent,
      font: context.font,
      color: context.palette.line,
    });
    context.yPosition -= 15;
  }

  private renderResumeExperienceItem(
    context: ResumeRenderContext,
    experience: ResumeExperienceItem,
  ): void {
    this.ensureResumeSpace(context, 80);

    context.page.drawText(`${experience.title} | ${experience.company}`, {
      x: context.margin,
      y: context.yPosition,
      size: 11,
      font: context.boldFont,
      color: context.palette.text,
    });
    context.yPosition -= 15;

    this.renderResumeExperienceDate(context, experience);
    this.renderResumeExperienceDescription(context, experience.description);
    this.renderResumeExperienceAchievements(context, experience.achievements);
    this.renderResumeExperienceTechnologies(context, experience.technologies);
    context.yPosition -= 10;
  }

  private renderResumeExperience(context: ResumeRenderContext, resume: ResumeData): void {
    if (!Array.isArray(resume.experience) || resume.experience.length === 0) {
      return;
    }

    this.renderResumeSectionHeader(context, "EXPERIENCE");
    for (const experience of resume.experience) {
      this.renderResumeExperienceItem(context, experience);
    }
  }

  private renderResumeEducationItem(context: ResumeRenderContext, education: ResumeEducationItem): void {
    this.ensureResumeSpace(context, 50);

    context.page.drawText(`${education.degree} in ${education.field}`, {
      x: context.margin,
      y: context.yPosition,
      size: 11,
      font: context.boldFont,
      color: context.palette.text,
    });
    context.yPosition -= 15;

    const details = [education.school, education.year];
    if (education.gpa) {
      details.push(`GPA: ${education.gpa}`);
    }

    context.page.drawText(details.join(" | "), {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.accent,
      font: context.font,
      color: context.palette.line,
    });
    context.yPosition -= 20;
  }

  private renderResumeEducation(context: ResumeRenderContext, resume: ResumeData): void {
    if (!Array.isArray(resume.education) || resume.education.length === 0) {
      return;
    }

    this.renderResumeSectionHeader(context, "EDUCATION");
    for (const education of resume.education) {
      this.renderResumeEducationItem(context, education);
    }
  }

  private renderResumeSkillGroup(
    context: ResumeRenderContext,
    options: ResumeSkillGroupOptions,
  ): void {
    if (!Array.isArray(options.items) || options.items.length === 0) {
      return;
    }

    this.ensureResumeSpace(context, 30);
    if (options.label) {
      context.page.drawText(options.label, {
        x: context.margin,
        y: context.yPosition,
        size: context.fonts.body,
        font: context.boldFont,
        color: options.labelColor,
      });
      context.yPosition -= 15;
    }

    this.drawResumeWrappedText(context, {
      text: options.items.join(options.separator),
      x: context.margin,
      size: context.fonts.body,
      color: context.palette.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2,
    });
    context.yPosition -= options.trailingGap;
  }

  private renderResumeInlineSkills(context: ResumeRenderContext, skills: ResumeSkillsData): void {
    this.renderResumeSkillGroup(context, {
      label: null,
      items: skills.technical,
      separator: " • ",
      labelColor: context.palette.text,
      trailingGap: 5,
    });
    this.renderResumeSkillGroup(context, {
      label: "Soft Skills:",
      items: skills.soft,
      separator: " • ",
      labelColor: context.palette.text,
      trailingGap: 10,
    });
  }

  private renderResumeGroupedSkills(context: ResumeRenderContext, skills: ResumeSkillsData): void {
    this.renderResumeSkillGroup(context, {
      label: "> TECHNICAL",
      items: skills.technical,
      separator: ", ",
      labelColor: context.palette.accent,
      trailingGap: 5,
    });
    this.renderResumeSkillGroup(context, {
      label: "> SOFT SKILLS",
      items: skills.soft,
      separator: ", ",
      labelColor: context.palette.accent,
      trailingGap: 10,
    });
  }

  private renderResumeColumnSkills(context: ResumeRenderContext, skills: ResumeSkillsData): void {
    this.renderResumeSkillGroup(context, {
      label: "Technical:",
      items: skills.technical,
      separator: ", ",
      labelColor: context.palette.text,
      trailingGap: 5,
    });
    this.renderResumeSkillGroup(context, {
      label: "Soft Skills:",
      items: skills.soft,
      separator: ", ",
      labelColor: context.palette.text,
      trailingGap: 10,
    });
  }

  private renderResumeSkills(context: ResumeRenderContext, resume: ResumeData): void {
    if (!resume.skills) {
      return;
    }

    this.renderResumeSectionHeader(context, "SKILLS");
    if (context.layout.skillsLayout === "inline-tags") {
      this.renderResumeInlineSkills(context, resume.skills);
      return;
    }

    if (context.layout.skillsLayout === "grouped") {
      this.renderResumeGroupedSkills(context, resume.skills);
      return;
    }

    this.renderResumeColumnSkills(context, resume.skills);
  }

  private renderResumeProjectLinks(context: ResumeRenderContext, link?: string): void {
    if (!link) {
      return;
    }

    this.ensureResumeSpace(context, 20);
    context.page.drawText(`Link: ${link}`, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.accent,
      font: context.font,
      color: context.palette.accent,
    });
    context.yPosition -= 15;
  }

  private renderResumeProjectTechnologies(
    context: ResumeRenderContext,
    technologies?: string[],
  ): void {
    if (!Array.isArray(technologies) || technologies.length === 0) {
      return;
    }

    this.ensureResumeSpace(context, 20);
    context.page.drawText(`Technologies: ${technologies.join(", ")}`, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.accent,
      font: context.font,
      color: context.palette.line,
    });
    context.yPosition -= 15;
  }

  private renderResumeProjectItem(context: ResumeRenderContext, project: ResumeProjectItem): void {
    this.ensureResumeSpace(context, 60);

    context.page.drawText(project.title, {
      x: context.margin,
      y: context.yPosition,
      size: 11,
      font: context.boldFont,
      color: context.palette.text,
    });
    context.yPosition -= 15;

    this.drawResumeWrappedText(context, {
      text: project.description,
      x: context.margin,
      size: context.fonts.body,
      color: context.palette.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2,
    });
    context.yPosition -= 5;

    this.renderResumeProjectTechnologies(context, project.technologies);
    this.renderResumeProjectLinks(context, project.link);
    context.yPosition -= 5;
  }

  private renderResumeProjects(context: ResumeRenderContext, resume: ResumeData): void {
    if (!Array.isArray(resume.projects) || resume.projects.length === 0) {
      return;
    }

    this.renderResumeSectionHeader(context, "PROJECTS");
    for (const project of resume.projects) {
      this.renderResumeProjectItem(context, project);
    }
  }

  private renderResumeGamingExperience(context: ResumeRenderContext, resume: ResumeData): void {
    if (!resume.gamingExperience) {
      return;
    }

    const gamingItems = this.collectDefinedValues([
      resume.gamingExperience.gameEngines
        ? `Engines: ${resume.gamingExperience.gameEngines}`
        : undefined,
      resume.gamingExperience.platforms ? `Platforms: ${resume.gamingExperience.platforms}` : undefined,
      resume.gamingExperience.genres ? `Genres: ${resume.gamingExperience.genres}` : undefined,
      resume.gamingExperience.shippedTitles
        ? `Shipped Titles: ${resume.gamingExperience.shippedTitles}`
        : undefined,
    ]);

    if (gamingItems.length === 0) {
      return;
    }

    this.renderResumeSectionHeader(context, "GAMING EXPERIENCE");
    for (const item of gamingItems) {
      this.ensureResumeSpace(context, 20);
      context.page.drawText(item, {
        x: context.margin,
        y: context.yPosition,
        size: context.fonts.body,
        font: context.font,
        color: context.palette.text,
      });
      context.yPosition -= 15;
    }
  }

  /**
   * Export resume as PDF.
   */
  async exportResumePDF(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    const resolvedTemplate = this.resolveTemplate(templateName, resume.template);
    const template =
      RESUME_TEMPLATES[resolvedTemplate] ?? RESUME_TEMPLATES[RESUME_TEMPLATE_DEFAULT];
    if (!template) {
      throw new Error(`Unsupported resume template: ${resolvedTemplate}`);
    }

    const context = await this.createResumeContext(template);
    this.renderResumeHeader(context, resume);
    this.renderResumeSummary(context, resume);
    this.renderResumeExperience(context, resume);
    this.renderResumeEducation(context, resume);
    this.renderResumeSkills(context, resume);
    this.renderResumeProjects(context, resume);
    this.renderResumeGamingExperience(context, resume);

    return context.pdfDoc.save();
  }

  private async createCoverLetterContext(): Promise<CoverLetterRenderContext> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const page = this.addA4Page(pdfDoc);
    const { width, height } = page.getSize();

    return {
      pdfDoc,
      page,
      width,
      height,
      margin: COVER_LETTER_MARGIN,
      yPosition: height - COVER_LETTER_MARGIN,
      font,
      boldFont,
    };
  }

  private ensureCoverLetterSpace(context: CoverLetterRenderContext, requiredSpace: number): void {
    if (context.yPosition - requiredSpace >= context.margin) {
      return;
    }

    context.page = this.addA4Page(context.pdfDoc);
    context.yPosition = context.height - context.margin;
  }

  private renderCoverLetterSender(
    context: CoverLetterRenderContext,
    userProfile: CoverLetterUserProfile,
  ): void {
    context.page.drawText(userProfile.name, {
      x: context.margin,
      y: context.yPosition,
      size: 14,
      font: context.boldFont,
      color: COVER_LETTER_COLORS.text,
    });
    context.yPosition -= 18;

    const contactLine = this.collectDefinedValues([
      userProfile.email,
      userProfile.phone,
      userProfile.location,
    ]).join(" | ");
    if (!contactLine) {
      return;
    }

    context.page.drawText(contactLine, {
      x: context.margin,
      y: context.yPosition,
      size: 10,
      font: context.font,
      color: COVER_LETTER_COLORS.subtle,
    });
    context.yPosition -= 25;
  }

  private renderCoverLetterDate(context: CoverLetterRenderContext, date: Date): void {
    context.page.drawText(COVER_LETTER_DATE_FORMATTER.format(date), {
      x: context.margin,
      y: context.yPosition,
      size: 10,
      font: context.font,
      color: COVER_LETTER_COLORS.muted,
    });
    context.yPosition -= 25;
  }

  private renderCoverLetterRecipient(
    context: CoverLetterRenderContext,
    coverLetter: CoverLetterPayload,
  ): void {
    context.page.drawText(coverLetter.company, {
      x: context.margin,
      y: context.yPosition,
      size: 11,
      font: context.boldFont,
      color: COVER_LETTER_COLORS.text,
    });
    context.yPosition -= 15;

    context.page.drawText(`RE: ${coverLetter.position}`, {
      x: context.margin,
      y: context.yPosition,
      size: 10,
      font: context.font,
      color: COVER_LETTER_COLORS.muted,
    });
    context.yPosition -= 25;
  }

  private drawCoverLetterLine(context: CoverLetterRenderContext, line: string): void {
    this.ensureCoverLetterSpace(context, COVER_LETTER_LINE_HEIGHT);
    context.page.drawText(line, {
      x: context.margin,
      y: context.yPosition,
      size: COVER_LETTER_PARAGRAPH_SIZE,
      font: context.font,
      color: COVER_LETTER_COLORS.text,
    });
    context.yPosition -= COVER_LETTER_LINE_HEIGHT;
  }

  private drawCoverLetterParagraph(context: CoverLetterRenderContext, paragraph: string): void {
    const words = paragraph.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = `${line}${word} `;
      const lineWidth = context.font.widthOfTextAtSize(testLine, COVER_LETTER_PARAGRAPH_SIZE);
      if (lineWidth > context.width - context.margin * 2 && line.length > 0) {
        this.drawCoverLetterLine(context, line.trim());
        line = `${word} `;
        continue;
      }
      line = testLine;
    }

    if (line.trim().length > 0) {
      this.drawCoverLetterLine(context, line.trim());
    }
    context.yPosition -= COVER_LETTER_PARAGRAPH_GAP;
  }

  private renderCoverLetterBody(context: CoverLetterRenderContext, content: unknown): void {
    for (const paragraph of toCoverLetterParagraphs(content)) {
      this.drawCoverLetterParagraph(context, paragraph);
    }
  }

  private renderCoverLetterClosing(
    context: CoverLetterRenderContext,
    signerName: string,
  ): void {
    context.yPosition -= 10;
    this.ensureCoverLetterSpace(context, 35);

    context.page.drawText("Sincerely,", {
      x: context.margin,
      y: context.yPosition,
      size: 11,
      font: context.font,
      color: COVER_LETTER_COLORS.text,
    });
    context.yPosition -= 25;

    context.page.drawText(signerName, {
      x: context.margin,
      y: context.yPosition,
      size: 11,
      font: context.boldFont,
      color: COVER_LETTER_COLORS.text,
    });
  }

  /**
   * Export cover letter as PDF.
   */
  async exportCoverLetterPDF(
    coverLetter: CoverLetterPayload,
    userProfile: CoverLetterUserProfile,
  ): Promise<Uint8Array> {
    const context = await this.createCoverLetterContext();
    this.renderCoverLetterSender(context, userProfile);
    this.renderCoverLetterDate(context, new Date());
    this.renderCoverLetterRecipient(context, coverLetter);
    this.renderCoverLetterBody(context, coverLetter.content);
    this.renderCoverLetterClosing(context, userProfile.name);
    return context.pdfDoc.save();
  }

  /**
   * Optimize resume to fit on one page.
   */
  async optimizeForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    // First attempt with normal settings
    let pdfBytes = await this.exportResumePDF(resume, templateName);
    let pdfDoc = await PDFDocument.load(pdfBytes);

    if (pdfDoc.getPageCount() <= 1) return pdfBytes;

    // Clone resume data to avoid mutating original
    const optimized: ResumeData = structuredClone(resume);

    // Strategy 1: Remove optional sections (projects first, then gaming experience)
    const optimizedProjects = optimized.projects;
    if (Array.isArray(optimizedProjects) && optimizedProjects.length > 0 && pdfDoc.getPageCount() > 1) {
      optimized.projects = optimizedProjects.slice(0, 2); // Keep only top 2
      pdfBytes = await this.exportResumePDF(optimized, templateName);
      pdfDoc = await PDFDocument.load(pdfBytes);
    }

    if (pdfDoc.getPageCount() > 1 && optimized.gamingExperience) {
      optimized.gamingExperience = undefined;
      pdfBytes = await this.exportResumePDF(optimized, templateName);
      pdfDoc = await PDFDocument.load(pdfBytes);
    }

    if (pdfDoc.getPageCount() > 1 && optimized.projects) {
      optimized.projects = undefined;
      pdfBytes = await this.exportResumePDF(optimized, templateName);
      pdfDoc = await PDFDocument.load(pdfBytes);
    }

    // Strategy 2: Truncate experience descriptions
    if (pdfDoc.getPageCount() > 1 && optimized.experience) {
      for (const exp of optimized.experience) {
        const achievements = exp.achievements;
        if (Array.isArray(achievements) && achievements.length > 3) {
          exp.achievements = achievements.slice(0, 3);
        }
      }
      pdfBytes = await this.exportResumePDF(optimized, templateName);
    }

    return pdfBytes;
  }

  private async createPortfolioContext(): Promise<PortfolioRenderContext> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = this.addA4Page(pdfDoc);
    const { width, height } = page.getSize();

    return {
      pdfDoc,
      page,
      width,
      height,
      margin: PORTFOLIO_MARGIN,
      yPosition: height - PORTFOLIO_MARGIN,
      font,
      boldFont,
    };
  }

  private ensurePortfolioSpace(context: PortfolioRenderContext, requiredSpace: number): void {
    if (context.yPosition - requiredSpace >= context.margin) {
      return;
    }

    context.page = this.addA4Page(context.pdfDoc);
    context.yPosition = context.height - context.margin;
  }

  private drawPortfolioWrappedLine(
    context: PortfolioRenderContext,
    options: WrappedTextOptions,
    line: string,
  ): void {
    const lineGap = options.lineGap ?? RESUME_BODY_LINE_GAP;
    this.ensurePortfolioSpace(context, options.size + lineGap);
    context.page.drawText(line, {
      x: options.x,
      y: context.yPosition,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    context.yPosition -= options.size + lineGap;
  }

  private drawPortfolioWrappedText(
    context: PortfolioRenderContext,
    options: WrappedTextOptions,
  ): void {
    const words = options.text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = `${line}${word} `;
      const testWidth = options.font.widthOfTextAtSize(testLine, options.size);
      if (testWidth > options.maxWidth && line.length > 0) {
        this.drawPortfolioWrappedLine(context, options, line.trim());
        line = `${word} `;
        continue;
      }
      line = testLine;
    }

    if (line.trim().length > 0) {
      this.drawPortfolioWrappedLine(context, options, line.trim());
    }
  }

  private renderPortfolioSocialLinks(
    context: PortfolioRenderContext,
    social?: Record<string, string>,
  ): void {
    if (!social || Object.keys(social).length === 0) {
      return;
    }

    const socialLinks = Object.entries(social)
      .map(([platform, url]) => `${platform}: ${url}`)
      .join(" | ");

    context.page.drawText(socialLinks, {
      x: context.margin,
      y: context.yPosition,
      size: 9,
      font: context.font,
      color: PORTFOLIO_COLORS.muted,
    });
  }

  private renderPortfolioCoverPage(
    context: PortfolioRenderContext,
    metadata: PortfolioMetadata,
  ): void {
    context.yPosition = context.height / 2 + 100;

    context.page.drawText("PORTFOLIO", {
      x: context.margin,
      y: context.yPosition,
      size: 36,
      font: context.boldFont,
      color: PORTFOLIO_COLORS.primary,
    });
    context.yPosition -= 50;

    if (metadata.title) {
      context.page.drawText(metadata.title, {
        x: context.margin,
        y: context.yPosition,
        size: 20,
        font: context.boldFont,
        color: PORTFOLIO_COLORS.text,
      });
      context.yPosition -= 30;
    }

    if (metadata.author) {
      context.page.drawText(`By ${metadata.author}`, {
        x: context.margin,
        y: context.yPosition,
        size: 14,
        font: context.font,
        color: PORTFOLIO_COLORS.text,
      });
      context.yPosition -= 25;
    }

    if (metadata.description) {
      this.drawPortfolioWrappedText(context, {
        text: metadata.description,
        x: context.margin,
        size: 11,
        color: PORTFOLIO_COLORS.text,
        font: context.font,
        maxWidth: context.width - context.margin * 2,
      });
      context.yPosition -= 20;
    }

    if (metadata.website) {
      context.page.drawText(metadata.website, {
        x: context.margin,
        y: context.yPosition,
        size: 10,
        font: context.font,
        color: PORTFOLIO_COLORS.accent,
      });
      context.yPosition -= 20;
    }

    this.renderPortfolioSocialLinks(context, metadata.social);
  }

  private startPortfolioProjectsSection(context: PortfolioRenderContext): void {
    context.page = this.addA4Page(context.pdfDoc);
    context.yPosition = context.height - context.margin;

    context.page.drawText("PROJECTS", {
      x: context.margin,
      y: context.yPosition,
      size: 24,
      font: context.boldFont,
      color: PORTFOLIO_COLORS.primary,
    });
    context.yPosition -= 40;
  }

  private renderPortfolioProjectHeading(
    context: PortfolioRenderContext,
    project: PortfolioProject,
    index: number,
  ): void {
    context.page.drawText(`${index + 1}. ${project.title}`, {
      x: context.margin,
      y: context.yPosition,
      size: 16,
      font: context.boldFont,
      color: PORTFOLIO_COLORS.accent,
    });
    context.yPosition -= 20;

    if (!project.featured) {
      return;
    }

    context.page.drawText("* FEATURED", {
      x: context.margin,
      y: context.yPosition,
      size: 9,
      font: context.boldFont,
      color: PORTFOLIO_COLORS.featured,
    });
    context.yPosition -= 15;
  }

  private renderPortfolioProjectRole(context: PortfolioRenderContext, role?: string): void {
    if (!role) {
      return;
    }

    context.page.drawText(`Role: ${role}`, {
      x: context.margin,
      y: context.yPosition,
      size: 10,
      font: context.boldFont,
      color: PORTFOLIO_COLORS.text,
    });
    context.yPosition -= 15;
  }

  private renderPortfolioProjectTechnologies(
    context: PortfolioRenderContext,
    technologies?: string[],
  ): void {
    if (!Array.isArray(technologies) || technologies.length === 0) {
      return;
    }

    this.ensurePortfolioSpace(context, 25);
    context.page.drawText(`Technologies: ${technologies.join(", ")}`, {
      x: context.margin,
      y: context.yPosition,
      size: 9,
      font: context.font,
      color: PORTFOLIO_COLORS.muted,
    });
    context.yPosition -= 15;
  }

  private renderPortfolioTechnicalDetails(
    context: PortfolioRenderContext,
    project: PortfolioProject,
  ): void {
    const details = this.collectDefinedValues([
      project.platforms && project.platforms.length > 0
        ? `Platforms: ${project.platforms.join(", ")}`
        : undefined,
      project.engines && project.engines.length > 0
        ? `Engines: ${project.engines.join(", ")}`
        : undefined,
    ]);

    if (details.length === 0) {
      return;
    }

    this.ensurePortfolioSpace(context, 25);
    context.page.drawText(details.join(" | "), {
      x: context.margin,
      y: context.yPosition,
      size: 9,
      font: context.font,
      color: PORTFOLIO_COLORS.muted,
    });
    context.yPosition -= 15;
  }

  private renderPortfolioProjectLinks(
    context: PortfolioRenderContext,
    project: PortfolioProject,
  ): void {
    const links = this.collectDefinedValues([
      project.liveUrl ? `Live: ${project.liveUrl}` : undefined,
      project.githubUrl ? `GitHub: ${project.githubUrl}` : undefined,
    ]);

    if (links.length === 0) {
      return;
    }

    this.ensurePortfolioSpace(context, 25);
    context.page.drawText(links.join(" | "), {
      x: context.margin,
      y: context.yPosition,
      size: 9,
      font: context.font,
      color: PORTFOLIO_COLORS.accent,
    });
    context.yPosition -= 15;
  }

  private renderPortfolioProjectTags(
    context: PortfolioRenderContext,
    tags?: string[],
  ): void {
    if (!Array.isArray(tags) || tags.length === 0) {
      return;
    }

    this.ensurePortfolioSpace(context, 25);
    context.page.drawText(`Tags: ${tags.join(", ")}`, {
      x: context.margin,
      y: context.yPosition,
      size: 8,
      font: context.font,
      color: PORTFOLIO_COLORS.footer,
    });
    context.yPosition -= 20;
  }

  private renderPortfolioProjectSeparator(
    context: PortfolioRenderContext,
    shouldRender: boolean,
  ): void {
    if (!shouldRender) {
      return;
    }

    this.ensurePortfolioSpace(context, 20);
    context.page.drawLine({
      start: { x: context.margin, y: context.yPosition },
      end: { x: context.width - context.margin, y: context.yPosition },
      thickness: 0.5,
      color: PORTFOLIO_COLORS.line,
    });
    context.yPosition -= 20;
  }

  private renderPortfolioProject(
    context: PortfolioRenderContext,
    project: PortfolioProject,
    index: number,
    totalProjects: number,
  ): void {
    this.ensurePortfolioSpace(context, PORTFOLIO_PROJECT_SPACE);
    this.renderPortfolioProjectHeading(context, project, index);
    this.renderPortfolioProjectRole(context, project.role);

    this.drawPortfolioWrappedText(context, {
      text: project.description,
      x: context.margin,
      size: 10,
      color: PORTFOLIO_COLORS.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2,
    });
    context.yPosition -= 10;

    this.renderPortfolioProjectTechnologies(context, project.technologies);
    this.renderPortfolioTechnicalDetails(context, project);
    this.renderPortfolioProjectLinks(context, project);
    this.renderPortfolioProjectTags(context, project.tags);

    context.yPosition -= 15;
    this.renderPortfolioProjectSeparator(context, index < totalProjects - 1);
  }

  private addPortfolioPageNumbers(context: PortfolioRenderContext): void {
    const pages = context.pdfDoc.getPages();
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      page.drawText(`Page ${index + 1} of ${pages.length}`, {
        x: context.width / 2 - PORTFOLIO_FOOTER_X_OFFSET,
        y: PORTFOLIO_FOOTER_Y,
        size: 8,
        font: context.font,
        color: PORTFOLIO_COLORS.footer,
      });
    }
  }

  /**
   * Export portfolio as PDF.
   */
  async exportPortfolioPDF(
    metadata: PortfolioMetadata,
    projects: PortfolioProject[],
  ): Promise<Uint8Array> {
    const context = await this.createPortfolioContext();
    this.renderPortfolioCoverPage(context, metadata);
    this.startPortfolioProjectsSection(context);

    for (let index = 0; index < projects.length; index += 1) {
      this.renderPortfolioProject(context, projects[index], index, projects.length);
    }

    this.addPortfolioPageNumbers(context);
    return context.pdfDoc.save();
  }
}

export const exportService = new ExportService();
