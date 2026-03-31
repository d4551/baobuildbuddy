import type { ResumeData } from "@bao/shared";
import { Paragraph, TextRun } from "docx";
import {
  createDivider,
  createSectionHeading,
  type DocxTemplateConfig,
  DOCX_RESUME_FONT_BODY_PT,
  DOCX_RESUME_FONT_HEADER_PT,
} from "./docx-export-contracts";
import {
  buildGamingExperienceSection,
  buildEducationItem,
  buildExperienceItem,
  buildProjectItem,
  buildSkillsSection,
} from "./docx-export-resume-content";
import { buildResumeHeader } from "./docx-export-resume-header";

function buildSummarySection(resume: ResumeData, config: DocxTemplateConfig): Paragraph[] {
  if (!resume.summary) {
    return [];
  }

  return [
    createSectionHeading(
      "Summary",
      config.primaryColorHex,
      DOCX_RESUME_FONT_HEADER_PT,
      config.fontFamily,
    ),
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
  ];
}

function buildRepeatableSection(
  title: string,
  config: DocxTemplateConfig,
  items: Paragraph[],
): Paragraph[] {
  if (items.length === 0) {
    return [];
  }

  return [
    createSectionHeading(
      title,
      config.primaryColorHex,
      DOCX_RESUME_FONT_HEADER_PT,
      config.fontFamily,
    ),
    ...items,
  ];
}

export function buildResumeSections(resume: ResumeData, config: DocxTemplateConfig): Paragraph[] {
  const experienceItems =
    resume.experience?.flatMap((item) => buildExperienceItem(item, config)) ?? [];
  const educationItems =
    resume.education?.flatMap((item) => buildEducationItem(item, config)) ?? [];
  const skillItems = resume.skills ? buildSkillsSection(resume.skills, config) : [];
  const projectItems =
    resume.projects?.flatMap((project) => buildProjectItem(project, config)) ?? [];
  const gamingItems = resume.gamingExperience
    ? buildGamingExperienceSection(resume.gamingExperience, config)
    : [];

  return [
    ...(resume.personalInfo ? buildResumeHeader(resume.personalInfo, config) : []),
    createDivider(config.primaryColorHex),
    ...buildSummarySection(resume, config),
    ...buildRepeatableSection("Experience", config, experienceItems),
    ...buildRepeatableSection("Education", config, educationItems),
    ...buildRepeatableSection("Skills", config, skillItems),
    ...buildRepeatableSection("Projects", config, projectItems),
    ...buildRepeatableSection("Gaming Experience", config, gamingItems),
  ];
}
