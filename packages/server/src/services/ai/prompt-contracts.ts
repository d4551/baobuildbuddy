import type { BrandSettings } from "@bao/shared";

export type BrandPromptIdentity = Pick<BrandSettings, "name" | "assistantName">;

export interface InterviewPersonaPromptInput {
  role: string;
  company: string;
  personality: string;
  interviewStyle: string;
  focusAreas: string[];
}
