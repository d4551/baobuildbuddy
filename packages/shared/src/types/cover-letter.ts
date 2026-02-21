import type { CoverLetterTemplate } from "../constants/cover-letter";

/**
 * Cover letter types
 */

export interface CoverLetterData {
  id?: string;
  company: string;
  position: string;
  jobInfo?: Record<string, unknown>;
  personalInfo?: Record<string, unknown>;
  companyResearch?: Record<string, unknown>;
  content: CoverLetterContent;
  template?: CoverLetterTemplate;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoverLetterContent {
  opening?: string;
  body?: string;
  closing?: string;
  signature?: string;
  // Alternate: full sections keyed by name
  [section: string]: string | undefined;
}
