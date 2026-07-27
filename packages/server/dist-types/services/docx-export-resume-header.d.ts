import type { ResumePersonalInfo } from "@bao/shared/types/resume";
import { Paragraph } from "docx";
import { type DocxTemplateConfig } from "./docx-export-contracts";
export declare function buildResumeHeader(info: ResumePersonalInfo, config: DocxTemplateConfig): Paragraph[];
