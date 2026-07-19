<script setup lang="ts">
import type { ResumeFormData } from "@bao/shared/utils/resume-transform";
import { SURFACE_GLASS_CARD_CLASS } from "~/constants/layout";

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
    :class="SURFACE_GLASS_CARD_CLASS"
  >
    <PersonalInfoForm
      :model-value="formData"
      @update:model-value="emit('updatePersonalInfo', $event)"
    />
  </div>

  <div 
    v-show="activeTab === 'experience'"
    :class="SURFACE_GLASS_CARD_CLASS"
  >
    <ExperienceList
      :model-value="formData.experience"
      @update:model-value="emit('updateExperience', $event)"
    />
  </div>

  <div 
    v-show="activeTab === 'education'"
    :class="SURFACE_GLASS_CARD_CLASS"
  >
    <EducationList
      :model-value="formData.education"
      @update:model-value="emit('updateEducation', $event)"
    />
  </div>

  <div 
    v-show="activeTab === 'skills'"
    :class="SURFACE_GLASS_CARD_CLASS"
  >
    <SkillsEditor :model-value="formData.skills" @update:model-value="emit('updateSkills', $event)" />
  </div>

  <div 
    v-show="activeTab === 'projects'"
    :class="SURFACE_GLASS_CARD_CLASS"
  >
    <ResumeProjectsEditor
      :model-value="formData.projects"
      @update:model-value="emit('updateProjects', $event)"
    />
  </div>

  <div 
    v-show="activeTab === 'gaming'"
    :class="SURFACE_GLASS_CARD_CLASS"
  >
    <ResumeGamingFields
      :model-value="formData.gaming"
      @update:model-value="emit('updateGaming', $event)"
    />
  </div>
</template>
