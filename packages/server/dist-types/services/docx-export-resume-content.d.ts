import type { ResumeData } from "@bao/shared";
import { Paragraph } from "docx";
import { type DocxTemplateConfig, type ResumeEducationItem, type ResumeExperienceItem, type ResumeProjectItem, type ResumeSkillsData } from "./docx-export-contracts";
export declare function buildExperienceItem(item: ResumeExperienceItem, config: DocxTemplateConfig): Paragraph[];
export declare function buildEducationItem(item: ResumeEducationItem, config: DocxTemplateConfig): Paragraph[];
export declare function buildSkillsSection(skills: ResumeSkillsData, config: DocxTemplateConfig): Paragraph[];
export declare function buildProjectItem(project: ResumeProjectItem, config: DocxTemplateConfig): Paragraph[];
export declare function buildGamingExperienceSection(gaming: NonNullable<ResumeData["gamingExperience"]>, config: DocxTemplateConfig): Paragraph[];
