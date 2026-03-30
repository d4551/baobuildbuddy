import type { ResumeFormData } from "@bao/shared";
import type { RouteLocationRaw } from "vue-router";

export type ResumeTabId =
  | "personal"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "gaming";

export const RESUME_TABS = [
  "personal",
  "experience",
  "education",
  "skills",
  "projects",
  "gaming",
] as const satisfies readonly ResumeTabId[];

export type ResumePersonalFields = Pick<
  ResumeFormData,
  "name" | "email" | "phone" | "location" | "summary" | "linkedIn" | "portfolio"
>;

export interface ResumeCompletionSection {
  readonly id: ResumeTabId;
  readonly completed: boolean;
}

export interface ResumeCompletionQuickAction {
  readonly id: string;
  readonly to: RouteLocationRaw;
  readonly labelKey: string;
}
