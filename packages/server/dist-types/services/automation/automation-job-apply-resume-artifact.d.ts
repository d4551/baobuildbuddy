import type { ResumeData } from "@bao/shared/types/resume";
export declare const createResumeUploadArtifact: (runArtifactDir: string, resume: ResumeData) => Promise<string | undefined>;
