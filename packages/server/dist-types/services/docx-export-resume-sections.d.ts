import type { ResumeData } from "@bao/shared";
import { Paragraph } from "docx";
import { type DocxTemplateConfig } from "./docx-export-contracts";
export declare function buildResumeSections(resume: ResumeData, config: DocxTemplateConfig): Paragraph[];
