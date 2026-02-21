import type { ResumeTemplate, ResumeExportFormat } from "../constants/resume";

/**
 * Resume types for builder, exports, and AI services
 */

export interface ResumeData {
  id?: string;
  name?: string;
  personalInfo?: ResumePersonalInfo;
  summary?: string;
  experience?: ResumeExperienceItem[];
  education?: ResumeEducationItem[];
  skills?: ResumeSkills;
  projects?: ResumeProject[];
  gamingExperience?: GamingExperience;
  template?: ResumeTemplate;
  theme?: "light" | "dark";
  isDefault?: boolean;
}

export interface ResumePersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
}

export interface ResumeExperienceItem {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  location?: string;
  description?: string;
  achievements?: string[];
  technologies?: string[];
}

export interface ResumeEducationItem {
  degree: string;
  field: string;
  school: string;
  year: string;
  gpa?: string;
}

export interface ResumeSkills {
  technical?: string[];
  soft?: string[];
  gaming?: string[];
}

export interface ResumeProject {
  title: string;
  description: string;
  technologies?: string[];
  link?: string;
}

export interface GamingExperience {
  gameEngines?: string;
  platforms?: string;
  genres?: string;
  shippedTitles?: string;
}

export type ExportFormat = ResumeExportFormat;

export interface ExportOptions {
  template?: ResumeTemplate;
  theme?: "light" | "dark";
  pageFormat?: "A4" | "Letter";
  includeSummary?: boolean;
  includeProjects?: boolean;
  includeGamingExperience?: boolean;
}
