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
  <div
    v-show="activeTab === 'personal'"
    class="card bg-base-200"
  >
    <PersonalInfoForm
      :model-value="formData"
      @update:model-value="emit('updatePersonalInfo', $event)"
    />
  </div>

  <div
    v-show="activeTab === 'experience'"
    class="card bg-base-200"
  >
    <ExperienceList
      :model-value="formData.experience"
      @update:model-value="emit('updateExperience', $event)"
    />
  </div>

  <div
    v-show="activeTab === 'education'"
    class="card bg-base-200"
  >
    <EducationList
      :model-value="formData.education"
      @update:model-value="emit('updateEducation', $event)"
    />
  </div>

  <div
    v-show="activeTab === 'skills'"
    class="card bg-base-200"
  >
    <SkillsEditor :model-value="formData.skills" @update:model-value="emit('updateSkills', $event)" />
  </div>

  <div
    v-show="activeTab === 'projects'"
    class="card bg-base-200"
  >
    <ResumeProjectsEditor
      :model-value="formData.projects"
      @update:model-value="emit('updateProjects', $event)"
    />
  </div>

  <div
    v-show="activeTab === 'gaming'"
    class="card bg-base-200"
  >
    <ResumeGamingFields
      :model-value="formData.gaming"
      @update:model-value="emit('updateGaming', $event)"
    />
  </div>
</template>
