import type { ResumeData } from "@bao/shared/types/resume";
import { PDFDocument } from "pdf-lib";
import { renderResumeHeader, renderResumeSummary } from "./export-service-resume-header";
import { createResumeContext, resolveResumePdfTemplate } from "./export-service-resume-layout";
import {
  renderResumeEducation,
  renderResumeGamingExperience,
  renderResumeSkills,
} from "./export-service-resume-profile";
import { renderResumeExperience, renderResumeProjects } from "./export-service-resume-work";
const NUM_3 = 3;

export async function exportResumePdf(
  resume: ResumeData,
  templateName?: string,
): Promise<Uint8Array> {
  const template = resolveResumePdfTemplate(templateName, resume.template);
  const context = await createResumeContext(template);
  renderResumeHeader(context, resume);
  renderResumeSummary(context, resume);
  renderResumeExperience(context, resume);
  renderResumeEducation(context, resume);
  renderResumeSkills(context, resume);
  renderResumeProjects(context, resume);
  renderResumeGamingExperience(context, resume);
  return context.pdfDoc.save();
}

export async function optimizeResumePdfForOnePage(
  resume: ResumeData,
  templateName?: string,
): Promise<Uint8Array> {
  let pdfBytes = await exportResumePdf(resume, templateName);
  let pdfDoc = await PDFDocument.load(pdfBytes);
  if (pdfDoc.getPageCount() <= 1) return pdfBytes;

  const optimized: ResumeData = structuredClone(resume);
  const optimizedProjects = optimized.projects;
  if (
    Array.isArray(optimizedProjects) &&
    optimizedProjects.length > 0 &&
    pdfDoc.getPageCount() > 1
  ) {
    optimized.projects = optimizedProjects.slice(0, 2);
    pdfBytes = await exportResumePdf(optimized, templateName);
    pdfDoc = await PDFDocument.load(pdfBytes);
  }

  if (pdfDoc.getPageCount() > 1 && optimized.gamingExperience) {
    optimized.gamingExperience = undefined;
    pdfBytes = await exportResumePdf(optimized, templateName);
    pdfDoc = await PDFDocument.load(pdfBytes);
  }

  if (pdfDoc.getPageCount() > 1 && optimized.projects) {
    optimized.projects = undefined;
    pdfBytes = await exportResumePdf(optimized, templateName);
    pdfDoc = await PDFDocument.load(pdfBytes);
  }

  if (pdfDoc.getPageCount() > 1 && optimized.experience) {
    for (const experience of optimized.experience) {
      const achievements = experience.achievements;
      if (Array.isArray(achievements) && achievements.length > NUM_3) {
        experience.achievements = achievements.slice(0, NUM_3);
      }
    }
    pdfBytes = await exportResumePdf(optimized, templateName);
  }

  return pdfBytes;
}
