import type { BrandSettings } from "@bao/shared/types/settings-contracts";

export type BrandPromptIdentity = Pick<BrandSettings, "name" | "assistantName">;

export interface InterviewPersonaPromptInput {
  role: string;
  company: string;
  personality: string;
  interviewStyle: string;
  focusAreas: string[];
}
