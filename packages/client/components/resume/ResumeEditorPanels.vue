<script setup lang="ts">
import type { ResumeFormData } from "@bao/shared/utils/resume-transform";

type ResumeEditorTabId = "personal" | "experience" | "education" | "skills" | "projects" | "gaming";

type ResumePersonalFields = Pick<
  ResumeFormData,
  "name" | "email" | "phone" | "location" | "summary" | "linkedIn" | "portfolio"
>;

interface ResumeEditorPanelsProps {
  readonly activeTab: ResumeEditorTabId;
  readonly formData: ResumeFormData;
}

defineProps<ResumeEditorPanelsProps>();

const emit = defineEmits<{
  updatePersonalInfo: [value: ResumePersonalFields];
  updateExperience: [value: ResumeFormData["experience"]];
  updateEducation: [value: ResumeFormData["education"]];
  updateSkills: [value: ResumeFormData["skills"]];
  updateProjects: [value: ResumeFormData["projects"]];
  updateGaming: [value: ResumeFormData["gaming"]];
}>();
</script>

<template>
  <UiGlassCard v-show="activeTab === 'personal'">
    <PersonalInfoForm
      :model-value="formData"
      @update:model-value="emit('updatePersonalInfo', $event)"
    />
  </UiGlassCard>

  <UiGlassCard v-show="activeTab === 'experience'">
    <ExperienceList
      :model-value="formData.experience"
      @update:model-value="emit('updateExperience', $event)"
    />
  </UiGlassCard>

  <UiGlassCard v-show="activeTab === 'education'">
    <EducationList
      :model-value="formData.education"
      @update:model-value="emit('updateEducation', $event)"
    />
  </UiGlassCard>

  <UiGlassCard v-show="activeTab === 'skills'">
    <SkillsEditor :model-value="formData.skills" @update:model-value="emit('updateSkills', $event)" />
  </UiGlassCard>

  <UiGlassCard v-show="activeTab === 'projects'">
    <ResumeProjectsEditor
      :model-value="formData.projects"
      @update:model-value="emit('updateProjects', $event)"
    />
  </UiGlassCard>

  <UiGlassCard v-show="activeTab === 'gaming'">
    <ResumeGamingFields
      :model-value="formData.gaming"
      @update:model-value="emit('updateGaming', $event)"
    />
  </UiGlassCard>
</template>
