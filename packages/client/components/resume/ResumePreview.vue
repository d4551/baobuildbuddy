<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
defineProps<{
  resume: {
    personalInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      website?: string;
      linkedin?: string;
      github?: string;
    };
    experience?: Array<{
      id: string;
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      description: string;
      highlights: string[];
    }>;
    education?: Array<{
      id: string;
      institution: string;
      degree: string;
      field: string;
      graduationDate: string;
      gpa?: string;
    }>;
    skills?: {
      technical: string[];
      soft: string[];
      gaming?: string[];
    };
  };
}>();
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body prose max-w-none">
      <!-- Personal Info -->
      <div class="text-center border-b border-base-300 pb-4 mb-6">
        <h1 class="text-3xl font-bold mb-2">{{ resume.personalInfo?.name || t("resumePreview.defaultName") }}</h1>
        <div class="flex flex-wrap justify-center gap-3 text-sm text-base-content/70">
          <span v-if="resume.personalInfo?.email">{{ resume.personalInfo.email }}</span>
          <span v-if="resume.personalInfo?.phone">{{ resume.personalInfo.phone }}</span>
          <span v-if="resume.personalInfo?.location">{{ resume.personalInfo.location }}</span>
        </div>
        <div class="flex flex-wrap justify-center gap-3 text-sm mt-2">
          <a v-if="resume.personalInfo?.website" :href="resume.personalInfo.website" class="link link-primary">
            {{ t("resumePreview.website") }}
          </a>
          <a v-if="resume.personalInfo?.linkedin" :href="resume.personalInfo.linkedin" class="link link-primary">
            {{ t("resumePreview.linkedin") }}
          </a>
          <a v-if="resume.personalInfo?.github" :href="resume.personalInfo.github" class="link link-primary">
            {{ t("resumePreview.github") }}
          </a>
        </div>
      </div>

      <!-- Experience -->
      <div v-if="resume.experience && resume.experience.length > 0" class="mb-6">
        <h2 class="text-2xl font-bold mb-4 border-b border-base-300 pb-2">{{ t("resumePreview.experience") }}</h2>
        <div
          v-for="exp in resume.experience"
          :key="exp.id"
          class="mb-4"
        >
          <div class="flex justify-between items-start mb-1">
            <h3 class="text-xl font-semibold">{{ exp.title }}</h3>
            <span class="text-sm text-base-content/70">
              {{ exp.startDate }} - {{ exp.endDate || t("resumePreview.present") }}
            </span>
          </div>
          <p class="text-lg font-medium text-base-content/80 mb-2">{{ exp.company }}</p>
          <p class="text-base mb-2">{{ exp.description }}</p>
          <ul v-if="exp.highlights.length > 0" class="list-disc list-inside space-y-1">
            <li v-for="(highlight, index) in exp.highlights" :key="index" class="text-sm">
              {{ highlight }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Education -->
      <div v-if="resume.education && resume.education.length > 0" class="mb-6">
        <h2 class="text-2xl font-bold mb-4 border-b border-base-300 pb-2">{{ t("resumePreview.education") }}</h2>
        <div
          v-for="edu in resume.education"
          :key="edu.id"
          class="mb-3"
        >
          <div class="flex justify-between items-start mb-1">
            <div>
              <h3 class="text-xl font-semibold">{{ edu.degree }}</h3>
              <p class="text-lg text-base-content/80">{{ edu.institution }}</p>
              <p class="text-base text-base-content/70">{{ edu.field }}</p>
            </div>
            <div class="text-right">
              <span class="text-sm text-base-content/70">{{ edu.graduationDate }}</span>
              <p v-if="edu.gpa" class="text-sm text-base-content/70">GPA: {{ edu.gpa }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div v-if="resume.skills" class="mb-6">
        <h2 class="text-2xl font-bold mb-4 border-b border-base-300 pb-2">{{ t("resumePreview.skills") }}</h2>

        <div v-if="resume.skills.technical?.length" class="mb-3">
          <h3 class="text-lg font-semibold mb-2">{{ t("resumePreview.technicalSkills") }}</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in resume.skills.technical"
              :key="index"
              class="badge badge-primary"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <div v-if="resume.skills.soft?.length" class="mb-3">
          <h3 class="text-lg font-semibold mb-2">{{ t("resumePreview.softSkills") }}</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in resume.skills.soft"
              :key="index"
              class="badge badge-secondary"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <div v-if="resume.skills.gaming?.length" class="mb-3">
          <h3 class="text-lg font-semibold mb-2">{{ t("resumePreview.gamingIndustrySkills") }}</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in resume.skills.gaming"
              :key="index"
              class="badge badge-accent"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
