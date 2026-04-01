import { Paragraph } from "docx";
import { type DocxTemplateConfig, type ResumePersonalInfo } from "./docx-export-contracts";
export declare function buildResumeHeader(info: ResumePersonalInfo, config: DocxTemplateConfig): Paragraph[];
