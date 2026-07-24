import type { ResumeData } from "@bao/shared/types/resume";
import { collectDefinedStringValues } from "@bao/shared/utils/export-contract";
import type {
  ResumeEducationItem,
  ResumeRenderContext,
  ResumeSkillGroupOptions,
  ResumeSkillsData,
} from "./export-service-contracts";
import {
  drawResumeWrappedText,
  ensureResumeSpace,
  renderResumeSectionHeader,
} from "./export-service-resume-layout";
const NUM_15 = 15;
const NUM_20 = 20;
const NUM_30 = 30;
const NUM_50 = 50;

function renderResumeEducationItem(
  context: ResumeRenderContext,
  education: ResumeEducationItem,
): void {
  ensureResumeSpace(context, NUM_50);
  context.page.drawText(`${education.degree} in ${education.field}`, {
    x: context.margin,
    y: context.yPosition,
    size: 11,
    font: context.boldFont,
    color: context.palette.text,
  });
  context.yPosition -= NUM_15;

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
  context.yPosition -= NUM_20;
}

export function renderResumeEducation(context: ResumeRenderContext, resume: ResumeData): void {
  if (!Array.isArray(resume.education) || resume.education.length === 0) {
    return;
  }

  renderResumeSectionHeader(context, "EDUCATION");
  for (const education of resume.education) {
    renderResumeEducationItem(context, education);
  }
}

function renderResumeSkillGroup(
  context: ResumeRenderContext,
  options: ResumeSkillGroupOptions,
): void {
  if (!Array.isArray(options.items) || options.items.length === 0) {
    return;
  }

  ensureResumeSpace(context, NUM_30);
  if (options.label) {
    context.page.drawText(options.label, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.body,
      font: context.boldFont,
      color: options.labelColor,
    });
    context.yPosition -= NUM_15;
  }

  drawResumeWrappedText(context, {
    text: options.items.join(options.separator),
    x: context.margin,
    size: context.fonts.body,
    color: context.palette.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
  });
  context.yPosition -= options.trailingGap;
}

function renderResumeInlineSkills(context: ResumeRenderContext, skills: ResumeSkillsData): void {
  renderResumeSkillGroup(context, {
    label: null,
    items: skills.technical,
    separator: " • ",
    labelColor: context.palette.text,
    trailingGap: 5,
  });
  renderResumeSkillGroup(context, {
    label: "Soft Skills:",
    items: skills.soft,
    separator: " • ",
    labelColor: context.palette.text,
    trailingGap: 10,
  });
}

function renderResumeGroupedSkills(context: ResumeRenderContext, skills: ResumeSkillsData): void {
  renderResumeSkillGroup(context, {
    label: "> TECHNICAL",
    items: skills.technical,
    separator: ", ",
    labelColor: context.palette.accent,
    trailingGap: 5,
  });
  renderResumeSkillGroup(context, {
    label: "> SOFT SKILLS",
    items: skills.soft,
    separator: ", ",
    labelColor: context.palette.accent,
    trailingGap: 10,
  });
}

function renderResumeColumnSkills(context: ResumeRenderContext, skills: ResumeSkillsData): void {
  renderResumeSkillGroup(context, {
    label: "Technical:",
    items: skills.technical,
    separator: ", ",
    labelColor: context.palette.text,
    trailingGap: 5,
  });
  renderResumeSkillGroup(context, {
    label: "Soft Skills:",
    items: skills.soft,
    separator: ", ",
    labelColor: context.palette.text,
    trailingGap: 10,
  });
}

export function renderResumeSkills(context: ResumeRenderContext, resume: ResumeData): void {
  if (!resume.skills) {
    return;
  }

  renderResumeSectionHeader(context, "SKILLS");
  if (context.layout.skillsLayout === "inline-tags") {
    renderResumeInlineSkills(context, resume.skills);
    return;
  }
  if (context.layout.skillsLayout === "grouped") {
    renderResumeGroupedSkills(context, resume.skills);
    return;
  }
  renderResumeColumnSkills(context, resume.skills);
}

export function renderResumeGamingExperience(
  context: ResumeRenderContext,
  resume: ResumeData,
): void {
  if (!resume.gamingExperience) {
    return;
  }

  const gamingItems = collectDefinedStringValues([
    resume.gamingExperience.gameEngines
      ? `Engines: ${resume.gamingExperience.gameEngines}`
      : undefined,
    resume.gamingExperience.platforms
      ? `Platforms: ${resume.gamingExperience.platforms}`
      : undefined,
    resume.gamingExperience.genres ? `Genres: ${resume.gamingExperience.genres}` : undefined,
    resume.gamingExperience.shippedTitles
      ? `Shipped Titles: ${resume.gamingExperience.shippedTitles}`
      : undefined,
  ]);

  if (gamingItems.length === 0) {
    return;
  }

  renderResumeSectionHeader(context, "GAMING EXPERIENCE");
  for (const item of gamingItems) {
    ensureResumeSpace(context, NUM_20);
    context.page.drawText(item, {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.body,
      font: context.font,
      color: context.palette.text,
    });
    context.yPosition -= NUM_15;
  }
}
