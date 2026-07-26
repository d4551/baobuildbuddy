import { RESUME_EXPORT_THEME_CONFIGS } from "@bao/shared/constants/export-resume-theme";
import { RESUME_TEMPLATE_DEFAULT } from "@bao/shared/constants/resume";
import type { ResumeData } from "@bao/shared/types/resume";
import { resolveResumeExportTemplate } from "@bao/shared/utils/export-contract";
import { Document, Packer } from "docx";
import { buildResumeSections } from "./docx-export-resume-sections";

export async function exportResumeDocxDocument(
  resume: ResumeData,
  templateName?: string,
): Promise<Uint8Array> {
  const resolvedTemplate = resolveResumeExportTemplate(templateName, resume.template);
  const config =
    RESUME_EXPORT_THEME_CONFIGS[resolvedTemplate]?.docx ??
    RESUME_EXPORT_THEME_CONFIGS[RESUME_TEMPLATE_DEFAULT].docx;
  const doc = new Document({
    sections: [{ children: buildResumeSections(resume, config) }],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
