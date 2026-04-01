import type { ResumeData } from "@bao/shared/types/resume";
export declare function exportResumePdf(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
export declare function optimizeResumePdfForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
