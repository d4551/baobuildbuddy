import type { ResumeData } from "@bao/shared/types/resume";
export declare function exportResumeDocxDocument(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
