import {
  COUNT_FIFTEEN,
  COUNT_FIVE,
  COUNT_THIRTY,
  COUNT_THREE,
  COUNT_TWENTY,
  PERCENT_HIGH,
} from "@bao/shared/constants/numeric";
import type { ResumeData, ResumeExperienceItem, ResumeProject } from "@bao/shared/types/resume";

import type { ResumeRenderContext } from "./export-service-contracts";
import {
  drawResumeWrappedText,
  ensureResumeSpace,
  renderResumeSectionHeader,
} from "./export-service-resume-layout";

function renderResumeExperienceDate(
  context: ResumeRenderContext,
  experience: ResumeExperienceItem,
): void {
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
  context.yPosition -= COUNT_FIFTEEN;
}

function renderResumeExperienceDescription(
  context: ResumeRenderContext,
  description?: string,
): void {
  if (!description) {
    return;
  }

  drawResumeWrappedText(context, {
    text: description,
    x: context.margin,
    size: context.fonts.body,
    color: context.palette.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
  });
  context.yPosition -= COUNT_FIVE;
}

function renderResumeExperienceAchievements(
  context: ResumeRenderContext,
  achievements?: string[],
): void {
  if (!Array.isArray(achievements) || achievements.length === 0) {
    return;
  }

  for (const achievement of achievements) {
    ensureResumeSpace(context, COUNT_THIRTY);
    context.page.drawText("•", {
      x: context.margin,
      y: context.yPosition,
      size: context.fonts.body,
      font: context.font,
      color: context.palette.text,
    });
    drawResumeWrappedText(context, {
      text: achievement,
      x: context.margin + COUNT_FIFTEEN,
      size: context.fonts.body,
      color: context.palette.text,
      font: context.font,
      maxWidth: context.width - context.margin * 2 - COUNT_FIFTEEN,
    });
    context.yPosition -= COUNT_THREE;
  }
}

function renderResumeExperienceTechnologies(
  context: ResumeRenderContext,
  technologies?: string[],
): void {
  if (!Array.isArray(technologies) || technologies.length === 0) {
    return;
  }

  ensureResumeSpace(context, COUNT_TWENTY);
  context.page.drawText(`Technologies: ${technologies.join(", ")}`, {
    x: context.margin,
    y: context.yPosition,
    size: context.fonts.accent,
    font: context.font,
    color: context.palette.line,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderResumeExperienceItem(
  context: ResumeRenderContext,
  experience: ResumeExperienceItem,
): void {
  ensureResumeSpace(context, PERCENT_HIGH);
  context.page.drawText(`${experience.title} | ${experience.company}`, {
    x: context.margin,
    y: context.yPosition,
    size: 11,
    font: context.boldFont,
    color: context.palette.text,
  });
  context.yPosition -= COUNT_FIFTEEN;

  renderResumeExperienceDate(context, experience);
  renderResumeExperienceDescription(context, experience.description);
  renderResumeExperienceAchievements(context, experience.achievements);
  renderResumeExperienceTechnologies(context, experience.technologies);
  context.yPosition -= 10;
}

export function renderResumeExperience(context: ResumeRenderContext, resume: ResumeData): void {
  if (!Array.isArray(resume.experience) || resume.experience.length === 0) {
    return;
  }

  renderResumeSectionHeader(context, "EXPERIENCE");
  for (const experience of resume.experience) {
    renderResumeExperienceItem(context, experience);
  }
}

function renderResumeProjectLinks(context: ResumeRenderContext, link?: string): void {
  if (!link) {
    return;
  }

  ensureResumeSpace(context, COUNT_TWENTY);
  context.page.drawText(`Link: ${link}`, {
    x: context.margin,
    y: context.yPosition,
    size: context.fonts.accent,
    font: context.font,
    color: context.palette.accent,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderResumeProjectTechnologies(
  context: ResumeRenderContext,
  technologies?: string[],
): void {
  if (!Array.isArray(technologies) || technologies.length === 0) {
    return;
  }

  ensureResumeSpace(context, COUNT_TWENTY);
  context.page.drawText(`Technologies: ${technologies.join(", ")}`, {
    x: context.margin,
    y: context.yPosition,
    size: context.fonts.accent,
    font: context.font,
    color: context.palette.line,
  });
  context.yPosition -= COUNT_FIFTEEN;
}

function renderResumeProjectItem(context: ResumeRenderContext, project: ResumeProject): void {
  ensureResumeSpace(context, 60);
  context.page.drawText(project.title, {
    x: context.margin,
    y: context.yPosition,
    size: 11,
    font: context.boldFont,
    color: context.palette.text,
  });
  context.yPosition -= COUNT_FIFTEEN;

  drawResumeWrappedText(context, {
    text: project.description,
    x: context.margin,
    size: context.fonts.body,
    color: context.palette.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
  });
  context.yPosition -= COUNT_FIVE;

  renderResumeProjectTechnologies(context, project.technologies);
  renderResumeProjectLinks(context, project.link);
  context.yPosition -= COUNT_FIVE;
}

export function renderResumeProjects(context: ResumeRenderContext, resume: ResumeData): void {
  if (!Array.isArray(resume.projects) || resume.projects.length === 0) {
    return;
  }

  renderResumeSectionHeader(context, "PROJECTS");
  for (const project of resume.projects) {
    renderResumeProjectItem(context, project);
  }
}
