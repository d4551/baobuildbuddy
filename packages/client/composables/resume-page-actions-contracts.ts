import type { formDataToResumeData, ResumeData, ResumeFormData, ResumeTemplate } from "@bao/shared";
import type { Ref } from "vue";

export type ResumePageActionsInput = {
  aiEnhance: (resumeId: string) => Promise<Partial<ResumeData>>;
  aiEnhancementStepLabels: Ref<readonly string[]>;
  aiScore: (resumeId: string, prompt: string) => Promise<unknown>;
  awardForAction: (action: "resumeSave" | "resumeEnhance") => Promise<{
    awarded: boolean;
    amount: number;
  }>;
  closeDeleteResumeDialog: () => void;
  createResume: (payload: {
    name: string;
    template: ResumeTemplate;
    personalInfo: Record<string, never>;
    experience: [];
    education: [];
    skills: Record<string, never>;
    projects: [];
    gamingExperience: Record<string, never>;
  }) => Promise<unknown>;
  creating: Ref<boolean>;
  deleteResume: (id: string) => Promise<unknown>;
  enhancing: Ref<boolean>;
  formData: ResumeFormData;
  newResumeName: Ref<string>;
  newResumeTemplate: Ref<ResumeTemplate>;
  pendingDeleteResumeId: Ref<string | null>;
  scoring: Ref<boolean>;
  selectedResumeId: Ref<string | null>;
  showCreateModal: Ref<boolean>;
  updateResume: (
    resumeId: string,
    updates: ReturnType<typeof formDataToResumeData>,
  ) => Promise<unknown>;
};
