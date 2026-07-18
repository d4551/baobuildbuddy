import type { ResumeFormData } from "@bao/shared/utils/resume-transform";
import type { Ref } from "vue";
import {
  RESUME_TABS,
  type ResumePersonalFields,
  type ResumeTabId,
} from "~/components/resume/resume-page-contracts";

export function useResumeViewActions(formData: ResumeFormData) {
  function clearResumeFilters(resumeSearchQuery: Ref<string>): void {
    resumeSearchQuery.value = "";
  }

  function handleCompletionTabSelect(activeTab: Ref<ResumeTabId>, tabId: string): void {
    const matchedTab = RESUME_TABS.find((tab) => tab === tabId);
    if (matchedTab) {
      activeTab.value = matchedTab;
    }
  }

  function selectResumeTab(activeTab: Ref<ResumeTabId>, tab: ResumeTabId): void {
    activeTab.value = tab;
  }

  function updateEducation(value: ResumeFormData["education"]): void {
    formData.education = value;
  }

  function updateExperience(value: ResumeFormData["experience"]): void {
    formData.experience = value;
  }

  function updateGaming(value: ResumeFormData["gaming"]): void {
    formData.gaming = value;
  }

  function updatePersonalInfo(value: ResumePersonalFields): void {
    Object.assign(formData, value);
  }

  function updateProjects(value: ResumeFormData["projects"]): void {
    formData.projects = value;
  }

  function updateSkills(value: ResumeFormData["skills"]): void {
    formData.skills = value;
  }

  return {
    clearResumeFilters,
    handleCompletionTabSelect,
    selectResumeTab,
    updateEducation,
    updateExperience,
    updateGaming,
    updatePersonalInfo,
    updateProjects,
    updateSkills,
  };
}
