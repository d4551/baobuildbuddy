import type { ResumeData, ResumeEducationItem, ResumeExperienceItem, ResumeProject, ResumeSkills } from "@bao/shared/types/resume";
import { Paragraph } from "docx";
import { type DocxTemplateConfig } from "./docx-export-contracts";
export declare function buildExperienceItem(item: ResumeExperienceItem, config: DocxTemplateConfig): Paragraph[];
export declare function buildEducationItem(item: ResumeEducationItem, config: DocxTemplateConfig): Paragraph[];
export declare function buildSkillsSection(skills: ResumeSkills, config: DocxTemplateConfig): Paragraph[];
export declare function buildProjectItem(project: ResumeProject, config: DocxTemplateConfig): Paragraph[];
export declare function buildGamingExperienceSection(gaming: NonNullable<ResumeData["gamingExperience"]>, config: DocxTemplateConfig): Paragraph[];
