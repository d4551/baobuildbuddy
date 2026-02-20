import type { PortfolioMetadata, PortfolioProject, ResumeData } from "@bao/shared";
import { type Color, PDFDocument, type PDFFont, StandardFonts, rgb } from "pdf-lib";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ResumeTemplate {
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

const TEMPLATES: Record<string, ResumeTemplate> = {
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

export class ExportService {
  /**
   * Export resume as PDF
   */
  async exportResumePDF(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    const template = TEMPLATES[templateName || resume.template || "modern"] || TEMPLATES.modern;
    const { fonts, colors, spacing, layout } = template;
    const margin = spacing.margins.left;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Add dark background for gaming template
    if (colors.bg.r < 0.5) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
        color: rgb(colors.bg.r, colors.bg.g, colors.bg.b),
      });
    }

    let yPosition = height - margin;

    const primaryColor = rgb(colors.primary.r, colors.primary.g, colors.primary.b);
    const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
    const lineColor = rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    const accentColor = rgb(colors.accent.r, colors.accent.g, colors.accent.b);

    // Helper to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition - requiredSpace < margin) {
        page = pdfDoc.addPage([595.28, 841.89]);
        // Add dark background for gaming template on new page
        if (colors.bg.r < 0.5) {
          page.drawRectangle({
            x: 0,
            y: 0,
            width: 595.28,
            height: 841.89,
            color: rgb(colors.bg.r, colors.bg.g, colors.bg.b),
          });
        }
        yPosition = height - margin;
        return true;
      }
      return false;
    };

    // Helper to draw text with line wrapping
    const drawText = (
      text: string,
      x: number,
      size: number,
      color: Color,
      font: PDFFont,
      maxWidth: number,
    ) => {
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];

      for (const word of words) {
        const testLine = `${line + word} `;
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth > maxWidth && line !== "") {
          lines.push(line.trim());
          line = `${word} `;
        } else {
          line = testLine;
        }
      }
      if (line.trim() !== "") {
        lines.push(line.trim());
      }

      for (const l of lines) {
        checkNewPage(size + 4);
        page.drawText(l, { x, y: yPosition, size, font, color });
        yPosition -= size + 4;
      }
    };

    // Header - Name and Contact
    if (resume.personalInfo?.name) {
      if (layout.headerStyle === "banner") {
        // Draw banner background
        page.drawRectangle({
          x: 0,
          y: yPosition - 10,
          width: 595.28,
          height: fonts.name + 20,
          color: primaryColor,
        });
        page.drawText(resume.personalInfo.name, {
          x: width / 2 - font.widthOfTextAtSize(resume.personalInfo.name, fonts.name) / 2,
          y: yPosition,
          size: fonts.name,
          font: boldFont,
          color: rgb(colors.bg.r, colors.bg.g, colors.bg.b),
        });
      } else if (layout.headerStyle === "centered") {
        page.drawText(resume.personalInfo.name, {
          x: width / 2 - font.widthOfTextAtSize(resume.personalInfo.name, fonts.name) / 2,
          y: yPosition,
          size: fonts.name,
          font: boldFont,
          color: primaryColor,
        });
      } else {
        page.drawText(resume.personalInfo.name, {
          x: margin,
          y: yPosition,
          size: fonts.name,
          font: boldFont,
          color: primaryColor,
        });
      }
      yPosition -= 30;
    }

    // Contact info
    const contactItems: string[] = [];
    if (resume.personalInfo?.email) contactItems.push(resume.personalInfo.email);
    if (resume.personalInfo?.phone) contactItems.push(resume.personalInfo.phone);
    if (resume.personalInfo?.location) contactItems.push(resume.personalInfo.location);

    if (contactItems.length > 0) {
      page.drawText(contactItems.join(" | "), {
        x: margin,
        y: yPosition,
        size: fonts.body,
        font,
        color: textColor,
      });
      yPosition -= 15;
    }

    // Links
    const linkItems: string[] = [];
    if (resume.personalInfo?.website) linkItems.push(resume.personalInfo.website);
    if (resume.personalInfo?.linkedIn) linkItems.push(resume.personalInfo.linkedIn);
    if (resume.personalInfo?.github) linkItems.push(resume.personalInfo.github);

    if (linkItems.length > 0) {
      page.drawText(linkItems.join(" | "), {
        x: margin,
        y: yPosition,
        size: fonts.accent,
        font,
        color: accentColor,
      });
      yPosition -= 25;
    }

    // Divider
    if (layout.dividerStyle === "line") {
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 1,
        color: lineColor,
      });
      yPosition -= 20;
    } else if (layout.dividerStyle === "accent-bar") {
      page.drawRectangle({
        x: margin,
        y: yPosition - 3,
        width: width - margin * 2,
        height: 5,
        color: accentColor,
      });
      yPosition -= 20;
    } else {
      yPosition -= 10;
    }

    // Summary
    if (resume.summary) {
      checkNewPage(60);
      page.drawText("SUMMARY", {
        x: margin,
        y: yPosition,
        size: fonts.header,
        font: boldFont,
        color: primaryColor,
      });
      yPosition -= 18;

      drawText(resume.summary, margin, fonts.body, textColor, font, width - margin * 2);
      yPosition -= 10;
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
      checkNewPage(60);
      page.drawText("EXPERIENCE", {
        x: margin,
        y: yPosition,
        size: fonts.header,
        font: boldFont,
        color: primaryColor,
      });
      yPosition -= 18;

      for (const exp of resume.experience) {
        checkNewPage(80);

        // Job title and company
        page.drawText(`${exp.title} | ${exp.company}`, {
          x: margin,
          y: yPosition,
          size: 11,
          font: boldFont,
          color: textColor,
        });
        yPosition -= 15;

        // Dates and location
        const dateStr = exp.endDate
          ? `${exp.startDate} - ${exp.endDate}`
          : `${exp.startDate} - Present`;
        const locDateStr = exp.location ? `${exp.location} | ${dateStr}` : dateStr;

        page.drawText(locDateStr, {
          x: margin,
          y: yPosition,
          size: fonts.accent,
          font,
          color: lineColor,
        });
        yPosition -= 15;

        // Description
        if (exp.description) {
          drawText(exp.description, margin, fonts.body, textColor, font, width - margin * 2);
          yPosition -= 5;
        }

        // Achievements
        if (exp.achievements && exp.achievements.length > 0) {
          for (const achievement of exp.achievements) {
            checkNewPage(30);
            page.drawText("•", {
              x: margin,
              y: yPosition,
              size: fonts.body,
              font,
              color: textColor,
            });
            drawText(
              achievement,
              margin + 15,
              fonts.body,
              textColor,
              font,
              width - margin * 2 - 15,
            );
            yPosition -= 3;
          }
        }

        // Technologies
        if (exp.technologies && exp.technologies.length > 0) {
          checkNewPage(20);
          page.drawText(`Technologies: ${exp.technologies.join(", ")}`, {
            x: margin,
            y: yPosition,
            size: fonts.accent,
            font,
            color: lineColor,
          });
          yPosition -= 15;
        }

        yPosition -= 10;
      }
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      checkNewPage(60);
      page.drawText("EDUCATION", {
        x: margin,
        y: yPosition,
        size: fonts.header,
        font: boldFont,
        color: primaryColor,
      });
      yPosition -= 18;

      for (const edu of resume.education) {
        checkNewPage(50);

        page.drawText(`${edu.degree} in ${edu.field}`, {
          x: margin,
          y: yPosition,
          size: 11,
          font: boldFont,
          color: textColor,
        });
        yPosition -= 15;

        const eduDetails = [edu.school, edu.year];
        if (edu.gpa) eduDetails.push(`GPA: ${edu.gpa}`);

        page.drawText(eduDetails.join(" | "), {
          x: margin,
          y: yPosition,
          size: fonts.accent,
          font,
          color: lineColor,
        });
        yPosition -= 20;
      }
    }

    // Skills
    if (resume.skills) {
      checkNewPage(60);
      page.drawText("SKILLS", {
        x: margin,
        y: yPosition,
        size: fonts.header,
        font: boldFont,
        color: primaryColor,
      });
      yPosition -= 18;

      if (layout.skillsLayout === "inline-tags") {
        // Inline tags style (Google XYZ)
        if (resume.skills.technical && resume.skills.technical.length > 0) {
          checkNewPage(30);
          const skillsText = resume.skills.technical.join(" • ");
          drawText(skillsText, margin, fonts.body, textColor, font, width - margin * 2);
          yPosition -= 5;
        }

        if (resume.skills.soft && resume.skills.soft.length > 0) {
          checkNewPage(30);
          page.drawText("Soft Skills:", {
            x: margin,
            y: yPosition,
            size: fonts.body,
            font: boldFont,
            color: textColor,
          });
          yPosition -= 15;

          const softSkillsText = resume.skills.soft.join(" • ");
          drawText(softSkillsText, margin, fonts.body, textColor, font, width - margin * 2);
          yPosition -= 10;
        }
      } else if (layout.skillsLayout === "grouped") {
        // Grouped style (Gaming)
        if (resume.skills.technical && resume.skills.technical.length > 0) {
          checkNewPage(30);
          page.drawText("> TECHNICAL", {
            x: margin,
            y: yPosition,
            size: fonts.body,
            font: boldFont,
            color: accentColor,
          });
          yPosition -= 15;

          drawText(
            resume.skills.technical.join(", "),
            margin,
            fonts.body,
            textColor,
            font,
            width - margin * 2,
          );
          yPosition -= 5;
        }

        if (resume.skills.soft && resume.skills.soft.length > 0) {
          checkNewPage(30);
          page.drawText("> SOFT SKILLS", {
            x: margin,
            y: yPosition,
            size: fonts.body,
            font: boldFont,
            color: accentColor,
          });
          yPosition -= 15;

          drawText(
            resume.skills.soft.join(", "),
            margin,
            fonts.body,
            textColor,
            font,
            width - margin * 2,
          );
          yPosition -= 10;
        }
      } else {
        // 2-column style (Modern - default)
        if (resume.skills.technical && resume.skills.technical.length > 0) {
          checkNewPage(30);
          page.drawText("Technical:", {
            x: margin,
            y: yPosition,
            size: fonts.body,
            font: boldFont,
            color: textColor,
          });
          yPosition -= 15;

          drawText(
            resume.skills.technical.join(", "),
            margin,
            fonts.body,
            textColor,
            font,
            width - margin * 2,
          );
          yPosition -= 5;
        }

        if (resume.skills.soft && resume.skills.soft.length > 0) {
          checkNewPage(30);
          page.drawText("Soft Skills:", {
            x: margin,
            y: yPosition,
            size: fonts.body,
            font: boldFont,
            color: textColor,
          });
          yPosition -= 15;

          drawText(
            resume.skills.soft.join(", "),
            margin,
            fonts.body,
            textColor,
            font,
            width - margin * 2,
          );
          yPosition -= 10;
        }
      }
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
      checkNewPage(60);
      page.drawText("PROJECTS", {
        x: margin,
        y: yPosition,
        size: fonts.header,
        font: boldFont,
        color: primaryColor,
      });
      yPosition -= 18;

      for (const project of resume.projects) {
        checkNewPage(60);

        page.drawText(project.title, {
          x: margin,
          y: yPosition,
          size: 11,
          font: boldFont,
          color: textColor,
        });
        yPosition -= 15;

        drawText(project.description, margin, fonts.body, textColor, font, width - margin * 2);
        yPosition -= 5;

        if (project.technologies && project.technologies.length > 0) {
          checkNewPage(20);
          page.drawText(`Technologies: ${project.technologies.join(", ")}`, {
            x: margin,
            y: yPosition,
            size: fonts.accent,
            font,
            color: lineColor,
          });
          yPosition -= 15;
        }

        if (project.link) {
          checkNewPage(20);
          page.drawText(`Link: ${project.link}`, {
            x: margin,
            y: yPosition,
            size: fonts.accent,
            font,
            color: accentColor,
          });
          yPosition -= 15;
        }

        yPosition -= 5;
      }
    }

    // Gaming Experience
    if (resume.gamingExperience) {
      checkNewPage(60);
      page.drawText("GAMING EXPERIENCE", {
        x: margin,
        y: yPosition,
        size: fonts.header,
        font: boldFont,
        color: primaryColor,
      });
      yPosition -= 18;

      const gamingItems: string[] = [];
      if (resume.gamingExperience.gameEngines) {
        gamingItems.push(`Engines: ${resume.gamingExperience.gameEngines}`);
      }
      if (resume.gamingExperience.platforms) {
        gamingItems.push(`Platforms: ${resume.gamingExperience.platforms}`);
      }
      if (resume.gamingExperience.genres) {
        gamingItems.push(`Genres: ${resume.gamingExperience.genres}`);
      }
      if (resume.gamingExperience.shippedTitles) {
        gamingItems.push(`Shipped Titles: ${resume.gamingExperience.shippedTitles}`);
      }

      for (const item of gamingItems) {
        checkNewPage(20);
        page.drawText(item, {
          x: margin,
          y: yPosition,
          size: fonts.body,
          font,
          color: textColor,
        });
        yPosition -= 15;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  /**
   * Export cover letter as PDF
   */
  async exportCoverLetterPDF(
    coverLetter: { company: string; position: string; content: Record<string, unknown> },
    userProfile: { name: string; email?: string; phone?: string; location?: string },
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const margin = 60;
    let y = height - margin;

    // Header: sender info
    if (userProfile.name) {
      page.drawText(userProfile.name, {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 18;
    }
    const contactLine = [userProfile.email, userProfile.phone, userProfile.location]
      .filter(Boolean)
      .join(" | ");
    if (contactLine) {
      page.drawText(contactLine, { x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 25;
    }

    // Date
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    page.drawText(dateStr, { x: margin, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 25;

    // Recipient
    page.drawText(coverLetter.company, {
      x: margin,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 15;
    page.drawText(`RE: ${coverLetter.position}`, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 25;

    // Body paragraphs
    const content = coverLetter.content;
    const paragraphs: string[] = [];
    if (content.opening) paragraphs.push(String(content.opening));
    if (content.body)
      paragraphs.push(
        ...(Array.isArray(content.body) ? content.body.map(String) : [String(content.body)]),
      );
    if (content.closing) paragraphs.push(String(content.closing));
    // Fallback: if content is a plain string
    if (paragraphs.length === 0 && typeof content === "string") {
      paragraphs.push(...(content as string).split("\n\n"));
    }

    for (const paragraph of paragraphs) {
      // Word-wrap the paragraph
      const words = paragraph.split(" ");
      let line = "";
      for (const word of words) {
        const testLine = `${line + word} `;
        if (font.widthOfTextAtSize(testLine, 11) > width - margin * 2 && line) {
          page.drawText(line.trim(), {
            x: margin,
            y,
            size: 11,
            font,
            color: rgb(0.15, 0.15, 0.15),
          });
          y -= 16;
          if (y < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - margin;
          }
          line = `${word} `;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        page.drawText(line.trim(), { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 16;
      }
      y -= 10; // paragraph gap
    }

    // Closing
    y -= 10;
    page.drawText("Sincerely,", { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 25;
    page.drawText(userProfile.name, {
      x: margin,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.15),
    });

    return await pdfDoc.save();
  }

  /**
   * Optimize resume to fit on one page
   */
  async optimizeForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    // First attempt with normal settings
    let pdfBytes = await this.exportResumePDF(resume, templateName);
    let pdfDoc = await PDFDocument.load(pdfBytes);

    if (pdfDoc.getPageCount() <= 1) return pdfBytes;

    // Clone resume data to avoid mutating original
    const optimized = JSON.parse(JSON.stringify(resume));

    // Strategy 1: Remove optional sections (projects first, then gaming experience)
    if (optimized.projects?.length > 0 && pdfDoc.getPageCount() > 1) {
      optimized.projects = optimized.projects.slice(0, 2); // Keep only top 2
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
        if (exp.achievements?.length > 3) {
          exp.achievements = exp.achievements.slice(0, 3);
        }
      }
      pdfBytes = await this.exportResumePDF(optimized, templateName);
      pdfDoc = await PDFDocument.load(pdfBytes);
    }

    return pdfBytes;
  }

  /**
   * Export portfolio as PDF
   */
  async exportPortfolioPDF(
    metadata: PortfolioMetadata,
    projects: PortfolioProject[],
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    const margin = 50;
    let yPosition = height - margin;

    const primaryColor = rgb(0.2, 0.1, 0.5);
    const textColor = rgb(0.2, 0.2, 0.2);
    const accentColor = rgb(0.5, 0.2, 0.6);

    // Helper to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition - requiredSpace < margin) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - margin;
        return true;
      }
      return false;
    };

    // Helper to draw text with line wrapping
    const drawText = (
      text: string,
      x: number,
      size: number,
      color: Color,
      font: PDFFont,
      maxWidth: number,
    ) => {
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];

      for (const word of words) {
        const testLine = `${line + word} `;
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth > maxWidth && line !== "") {
          lines.push(line.trim());
          line = `${word} `;
        } else {
          line = testLine;
        }
      }
      if (line.trim() !== "") {
        lines.push(line.trim());
      }

      for (const l of lines) {
        checkNewPage(size + 4);
        page.drawText(l, { x, y: yPosition, size, font, color });
        yPosition -= size + 4;
      }
    };

    // Cover page
    yPosition = height / 2 + 100;

    page.drawText("PORTFOLIO", {
      x: margin,
      y: yPosition,
      size: 36,
      font: boldFont,
      color: primaryColor,
    });
    yPosition -= 50;

    if (metadata.title) {
      page.drawText(metadata.title, {
        x: margin,
        y: yPosition,
        size: 20,
        font: boldFont,
        color: textColor,
      });
      yPosition -= 30;
    }

    if (metadata.author) {
      page.drawText(`By ${metadata.author}`, {
        x: margin,
        y: yPosition,
        size: 14,
        font,
        color: textColor,
      });
      yPosition -= 25;
    }

    if (metadata.description) {
      drawText(metadata.description, margin, 11, textColor, font, width - margin * 2);
      yPosition -= 20;
    }

    if (metadata.website) {
      page.drawText(metadata.website, {
        x: margin,
        y: yPosition,
        size: 10,
        font,
        color: accentColor,
      });
      yPosition -= 20;
    }

    // Social links
    if (metadata.social && Object.keys(metadata.social).length > 0) {
      const socialLinks = Object.entries(metadata.social)
        .map(([platform, url]) => `${platform}: ${url}`)
        .join(" | ");

      page.drawText(socialLinks, {
        x: margin,
        y: yPosition,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // Start projects on new page
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - margin;

    page.drawText("PROJECTS", {
      x: margin,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: primaryColor,
    });
    yPosition -= 40;

    // Render each project
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];

      checkNewPage(100);

      // Project number and title
      page.drawText(`${i + 1}. ${project.title}`, {
        x: margin,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: accentColor,
      });
      yPosition -= 20;

      // Featured badge
      if (project.featured) {
        page.drawText("* FEATURED", {
          x: margin,
          y: yPosition,
          size: 9,
          font: boldFont,
          color: rgb(0.8, 0.6, 0),
        });
        yPosition -= 15;
      }

      // Role
      if (project.role) {
        page.drawText(`Role: ${project.role}`, {
          x: margin,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: textColor,
        });
        yPosition -= 15;
      }

      // Description
      drawText(project.description, margin, 10, textColor, font, width - margin * 2);
      yPosition -= 10;

      // Technologies
      if (project.technologies && project.technologies.length > 0) {
        checkNewPage(25);
        page.drawText(`Technologies: ${project.technologies.join(", ")}`, {
          x: margin,
          y: yPosition,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 15;
      }

      // Platforms and Engines
      const techDetails: string[] = [];
      if (project.platforms && project.platforms.length > 0) {
        techDetails.push(`Platforms: ${project.platforms.join(", ")}`);
      }
      if (project.engines && project.engines.length > 0) {
        techDetails.push(`Engines: ${project.engines.join(", ")}`);
      }

      if (techDetails.length > 0) {
        checkNewPage(25);
        page.drawText(techDetails.join(" | "), {
          x: margin,
          y: yPosition,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 15;
      }

      // Links
      const links: string[] = [];
      if (project.liveUrl) links.push(`Live: ${project.liveUrl}`);
      if (project.githubUrl) links.push(`GitHub: ${project.githubUrl}`);

      if (links.length > 0) {
        checkNewPage(25);
        page.drawText(links.join(" | "), {
          x: margin,
          y: yPosition,
          size: 9,
          font,
          color: accentColor,
        });
        yPosition -= 15;
      }

      // Tags
      if (project.tags && project.tags.length > 0) {
        checkNewPage(25);
        page.drawText(`Tags: ${project.tags.join(", ")}`, {
          x: margin,
          y: yPosition,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPosition -= 20;
      }

      yPosition -= 15;

      // Draw separator line between projects
      if (i < projects.length - 1) {
        checkNewPage(20);
        page.drawLine({
          start: { x: margin, y: yPosition },
          end: { x: width - margin, y: yPosition },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
        yPosition -= 20;
      }
    }

    // Add footer with page numbers
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      page.drawText(`Page ${i + 1} of ${pages.length}`, {
        x: width / 2 - 30,
        y: 30,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
}

export const exportService = new ExportService();
