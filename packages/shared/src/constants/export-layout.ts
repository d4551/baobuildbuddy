/**
 * Export layout constants.
 * Single source of truth for resume, cover letter, and portfolio PDF/DOCX dimensions.
 */

import type { ResumeTemplate } from "./resume";

/** A4 page size in PDF points (width, height). */
export const A4_PAGE_SIZE: [number, number] = [595.28, 841.89];

export const A4_PAGE_WIDTH = A4_PAGE_SIZE[0];
export const A4_PAGE_HEIGHT = A4_PAGE_SIZE[1];

/** Resume layout. */
export const RESUME_SECTION_SPACE = 60;
export const RESUME_BODY_LINE_GAP = 4;
export const RESUME_HEADER_NAME_SPACING = 30;
export const RESUME_CONTACT_SPACING = 15;
export const RESUME_LINKS_SPACING = 25;
export const RESUME_DIVIDER_SPACING = 20;
export const RESUME_SECTION_HEADER_SPACING = 18;

/** Cover letter layout. */
export const COVER_LETTER_MARGIN = 60;
export const COVER_LETTER_PARAGRAPH_SIZE = 11;
export const COVER_LETTER_LINE_HEIGHT = 16;
export const COVER_LETTER_PARAGRAPH_GAP = 10;

/** Portfolio layout. */
export const PORTFOLIO_MARGIN = 50;
export const PORTFOLIO_PROJECT_SPACE = 100;
export const PORTFOLIO_FOOTER_Y = 30;
export const PORTFOLIO_FOOTER_X_OFFSET = 30;

/** Locale for date formatting (cover letters). */
export const EXPORT_DATE_LOCALE = "en-US";

/** DOCX MIME type for Word document responses. */
export const MIME_TYPE_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** DOCX resume font sizes in points. */
export const DOCX_RESUME_FONT_NAME_PT = 24;
export const DOCX_RESUME_FONT_HEADER_PT = 14;
export const DOCX_RESUME_FONT_BODY_PT = 11;
export const DOCX_RESUME_FONT_ACCENT_PT = 9;

/** DOCX cover-letter font sizes in points. */
export const DOCX_COVER_LETTER_FONT_BODY_PT = 11;
export const DOCX_COVER_LETTER_FONT_HEADER_PT = 14;

/** DOCX portfolio font sizes in points. */
export const DOCX_PORTFOLIO_FONT_TITLE_PT = 36;
export const DOCX_PORTFOLIO_FONT_HEADING_PT = 16;
export const DOCX_PORTFOLIO_FONT_BODY_PT = 10;

type ExportRgbColor = {
  r: number;
  g: number;
  b: number;
};

type ResumeExportTheme = {
  name: string;
  pdf: {
    fonts: { name: number; header: number; body: number; accent: number };
    colors: {
      primary: ExportRgbColor;
      secondary: ExportRgbColor;
      accent: ExportRgbColor;
      text: ExportRgbColor;
      background: ExportRgbColor;
    };
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
  };
  docx: {
    fontFamily: string;
    primaryColorHex: string;
    accentColorHex: string;
    secondaryColorHex: string;
    mutedColorHex: string;
  };
};

/**
 * Shared resume export theme definitions consumed by both PDF and DOCX renderers.
 */
export const RESUME_EXPORT_THEME_CONFIGS = {
  modern: {
    name: "Modern",
    pdf: {
      fonts: { name: 24, header: 14, body: 10.5, accent: 9 },
      colors: {
        primary: { r: 0.16, g: 0.38, b: 1.0 },
        secondary: { r: 0.39, g: 0.39, b: 0.39 },
        accent: { r: 0, g: 0.59, b: 0.53 },
        text: { r: 0.13, g: 0.13, b: 0.13 },
        background: { r: 1, g: 1, b: 1 },
      },
      spacing: {
        sectionGap: 16,
        lineHeight: 1.4,
        margins: { top: 50, right: 50, bottom: 50, left: 50 },
      },
      layout: {
        headerStyle: "left-aligned",
        dividerStyle: "line",
        skillsLayout: "2-column",
      },
    },
    docx: {
      primaryColorHex: "2962FF",
      accentColorHex: "009688",
      fontFamily: "Calibri",
      secondaryColorHex: "666666",
      mutedColorHex: "999999",
    },
  },
  classic: {
    name: "Classic",
    pdf: {
      fonts: { name: 22, header: 13, body: 10.5, accent: 9 },
      colors: {
        primary: { r: 0.2, g: 0.2, b: 0.2 },
        secondary: { r: 0.35, g: 0.35, b: 0.35 },
        accent: { r: 0.45, g: 0.45, b: 0.45 },
        text: { r: 0.12, g: 0.12, b: 0.12 },
        background: { r: 1, g: 1, b: 1 },
      },
      spacing: {
        sectionGap: 14,
        lineHeight: 1.35,
        margins: { top: 48, right: 48, bottom: 48, left: 48 },
      },
      layout: {
        headerStyle: "left-aligned",
        dividerStyle: "line",
        skillsLayout: "2-column",
      },
    },
    docx: {
      primaryColorHex: "333333",
      accentColorHex: "555555",
      fontFamily: "Times New Roman",
      secondaryColorHex: "555555",
      mutedColorHex: "777777",
    },
  },
  creative: {
    name: "Creative",
    pdf: {
      fonts: { name: 24, header: 14, body: 10.5, accent: 9 },
      colors: {
        primary: { r: 0.91, g: 0.12, b: 0.39 },
        secondary: { r: 0.35, g: 0.35, b: 0.35 },
        accent: { r: 1.0, g: 0.6, b: 0.0 },
        text: { r: 0.13, g: 0.13, b: 0.13 },
        background: { r: 1, g: 1, b: 1 },
      },
      spacing: {
        sectionGap: 16,
        lineHeight: 1.4,
        margins: { top: 48, right: 48, bottom: 48, left: 48 },
      },
      layout: {
        headerStyle: "centered",
        dividerStyle: "accent-bar",
        skillsLayout: "inline-tags",
      },
    },
    docx: {
      primaryColorHex: "E91E63",
      accentColorHex: "FF9800",
      fontFamily: "Georgia",
      secondaryColorHex: "666666",
      mutedColorHex: "999999",
    },
  },
  minimal: {
    name: "Minimal",
    pdf: {
      fonts: { name: 20, header: 12, body: 10, accent: 8.5 },
      colors: {
        primary: { r: 0.26, g: 0.26, b: 0.26 },
        secondary: { r: 0.46, g: 0.46, b: 0.46 },
        accent: { r: 0.55, g: 0.55, b: 0.55 },
        text: { r: 0.12, g: 0.12, b: 0.12 },
        background: { r: 1, g: 1, b: 1 },
      },
      spacing: {
        sectionGap: 12,
        lineHeight: 1.25,
        margins: { top: 36, right: 36, bottom: 36, left: 36 },
      },
      layout: {
        headerStyle: "left-aligned",
        dividerStyle: "none",
        skillsLayout: "inline-tags",
      },
    },
    docx: {
      primaryColorHex: "424242",
      accentColorHex: "757575",
      fontFamily: "Calibri",
      secondaryColorHex: "666666",
      mutedColorHex: "999999",
    },
  },
  "google-xyz": {
    name: "Google XYZ",
    pdf: {
      fonts: { name: 18, header: 12, body: 10, accent: 8.5 },
      colors: {
        primary: { r: 0.26, g: 0.52, b: 0.96 },
        secondary: { r: 0.37, g: 0.39, b: 0.41 },
        accent: { r: 0.2, g: 0.66, b: 0.33 },
        text: { r: 0.13, g: 0.13, b: 0.14 },
        background: { r: 1, g: 1, b: 1 },
      },
      spacing: {
        sectionGap: 12,
        lineHeight: 1.2,
        margins: { top: 36, right: 36, bottom: 36, left: 36 },
      },
      layout: {
        headerStyle: "left-aligned",
        dividerStyle: "none",
        skillsLayout: "inline-tags",
      },
    },
    docx: {
      primaryColorHex: "4285F4",
      accentColorHex: "34A853",
      fontFamily: "Calibri",
      secondaryColorHex: "5F6368",
      mutedColorHex: "80868B",
    },
  },
  gaming: {
    name: "Gaming",
    pdf: {
      fonts: { name: 28, header: 16, body: 10.5, accent: 9 },
      colors: {
        primary: { r: 0.54, g: 0.17, b: 0.89 },
        secondary: { r: 0, g: 1.0, b: 0.53 },
        accent: { r: 1.0, g: 0, b: 0.39 },
        text: { r: 0.94, g: 0.94, b: 0.94 },
        background: { r: 0.1, g: 0.1, b: 0.14 },
      },
      spacing: {
        sectionGap: 18,
        lineHeight: 1.3,
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
      },
      layout: {
        headerStyle: "banner",
        dividerStyle: "accent-bar",
        skillsLayout: "grouped",
      },
    },
    docx: {
      primaryColorHex: "8A2BE2",
      accentColorHex: "FF0064",
      fontFamily: "Consolas",
      secondaryColorHex: "00FF88",
      mutedColorHex: "B8B8C4",
    },
  },
  executive: {
    name: "Executive",
    pdf: {
      fonts: { name: 24, header: 14, body: 10.5, accent: 9 },
      colors: {
        primary: { r: 0.1, g: 0.14, b: 0.49 },
        secondary: { r: 0.35, g: 0.35, b: 0.35 },
        accent: { r: 0.79, g: 0.69, b: 0.22 },
        text: { r: 0.12, g: 0.12, b: 0.12 },
        background: { r: 1, g: 1, b: 1 },
      },
      spacing: {
        sectionGap: 16,
        lineHeight: 1.35,
        margins: { top: 48, right: 48, bottom: 48, left: 48 },
      },
      layout: {
        headerStyle: "left-aligned",
        dividerStyle: "line",
        skillsLayout: "2-column",
      },
    },
    docx: {
      primaryColorHex: "1A237E",
      accentColorHex: "C9B037",
      fontFamily: "Garamond",
      secondaryColorHex: "555555",
      mutedColorHex: "888888",
    },
  },
  technical: {
    name: "Technical",
    pdf: {
      fonts: { name: 22, header: 13, body: 10, accent: 8.5 },
      colors: {
        primary: { r: 0.0, g: 0.41, b: 0.36 },
        secondary: { r: 0.35, g: 0.35, b: 0.35 },
        accent: { r: 0.01, g: 0.47, b: 0.74 },
        text: { r: 0.12, g: 0.12, b: 0.12 },
        background: { r: 1, g: 1, b: 1 },
      },
      spacing: {
        sectionGap: 14,
        lineHeight: 1.25,
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
      },
      layout: {
        headerStyle: "left-aligned",
        dividerStyle: "line",
        skillsLayout: "grouped",
      },
    },
    docx: {
      primaryColorHex: "00695C",
      accentColorHex: "0277BD",
      fontFamily: "Consolas",
      secondaryColorHex: "555555",
      mutedColorHex: "888888",
    },
  },
} as const satisfies Record<ResumeTemplate, ResumeExportTheme>;

export type ResumePdfThemeConfig = (typeof RESUME_EXPORT_THEME_CONFIGS)[ResumeTemplate]["pdf"];
