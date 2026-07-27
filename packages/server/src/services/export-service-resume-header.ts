import {
  RESUME_CONTACT_SPACING,
  RESUME_DIVIDER_SPACING,
  RESUME_HEADER_NAME_SPACING,
  RESUME_LINKS_SPACING,
} from "@bao/shared/constants/export-layout";
import { COUNT_THREE, COUNT_TWENTY } from "@bao/shared/constants/numeric";
import type { ResumeData, ResumePersonalInfo } from "@bao/shared/types/resume";
import { collectDefinedStringValues } from "@bao/shared/utils/export-contract";
import { type ResumeRenderContext, toPdfColor } from "./export-service-contracts";
import { drawResumeWrappedText, renderResumeSectionHeader } from "./export-service-resume-layout";

function renderResumeName(context: ResumeRenderContext, name: string): void {
  if (context.layout.headerStyle === "banner") {
    context.page.drawRectangle({
      x: 0,
      y: context.yPosition - 10,
      width: context.width,
      height: context.fonts.name + COUNT_TWENTY,
      color: context.palette.primary,
    });
    context.page.drawText(name, {
      x: context.width / 2 - context.font.widthOfTextAtSize(name, context.fonts.name) / 2,
      y: context.yPosition,
      size: context.fonts.name,
      font: context.boldFont,
      color: toPdfColor(context.background),
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

function renderResumeContact(context: ResumeRenderContext, info?: ResumePersonalInfo): void {
  const contactItems = collectDefinedStringValues([info?.email, info?.phone, info?.location]);
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

function renderResumeLinks(context: ResumeRenderContext, info?: ResumePersonalInfo): void {
  const linkItems = collectDefinedStringValues([info?.website, info?.linkedIn, info?.github]);
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

function renderResumeDivider(context: ResumeRenderContext): void {
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
      y: context.yPosition - COUNT_THREE,
      width: context.width - context.margin * 2,
      height: 5,
      color: context.palette.accent,
    });
    context.yPosition -= RESUME_DIVIDER_SPACING;
    return;
  }

  context.yPosition -= 10;
}

export function renderResumeHeader(context: ResumeRenderContext, resume: ResumeData): void {
  const name = resume.personalInfo?.name;
  if (name) {
    renderResumeName(context, name);
    context.yPosition -= RESUME_HEADER_NAME_SPACING;
  }

  renderResumeContact(context, resume.personalInfo);
  renderResumeLinks(context, resume.personalInfo);
  renderResumeDivider(context);
}

export function renderResumeSummary(context: ResumeRenderContext, resume: ResumeData): void {
  if (!resume.summary) {
    return;
  }

  renderResumeSectionHeader(context, "SUMMARY");
  drawResumeWrappedText(context, {
    text: resume.summary,
    x: context.margin,
    size: context.fonts.body,
    color: context.palette.text,
    font: context.font,
    maxWidth: context.width - context.margin * 2,
  });
  context.yPosition -= 10;
}
