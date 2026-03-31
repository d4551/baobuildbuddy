<script setup lang="ts">
import type { ResumeData } from "@bao/shared";

defineProps<{
  resume: ResumeData;
  displaySkills: readonly string[];
  hasGamingExperience: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <div
    class="mx-auto max-w-4xl rounded-box border border-base-300 bg-base-100 p-8 text-base-content shadow-lg print:rounded-none print:border-0 print:p-0 print:shadow-none"
  >
    <div class="mb-8 border-b-2 border-base-content/30 pb-4 text-center">
      <h2 class="mb-2 text-4xl font-bold">{{ resume.personalInfo?.name || t("resumePreview.defaultName") }}</h2>
      <div class="flex flex-wrap justify-center gap-4 text-sm">
        <span v-if="resume.personalInfo?.email">{{ resume.personalInfo.email }}</span>
        <span v-if="resume.personalInfo?.phone">{{ resume.personalInfo.phone }}</span>
        <span v-if="resume.personalInfo?.location">{{ resume.personalInfo.location }}</span>
      </div>
      <div
        v-if="resume.personalInfo?.linkedIn || resume.personalInfo?.portfolio"
        class="mt-2 flex flex-wrap justify-center gap-4 text-sm"
      >
        <a
          v-if="resume.personalInfo?.linkedIn"
          :href="resume.personalInfo.linkedIn"
          class="link link-hover"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('resumePreview.linkedinLinkAria')"
        >
          {{ t("resumePreview.linkedin") }}
        </a>
        <a
          v-if="resume.personalInfo?.portfolio"
          :href="resume.personalInfo.portfolio"
          class="link link-hover"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('resumePreview.websiteLinkAria')"
        >
          {{ t("resumePreview.website") }}
        </a>
      </div>
    </div>

    <div v-if="resume.summary" class="mb-6">
      <PageHeaderBlock title-id="resume-preview-summary-title" :title="t('resumePage.personal.summaryLegend')" extra-class="mb-3" />
      <p class="text-sm leading-relaxed">{{ resume.summary }}</p>
    </div>

    <div v-if="resume.experience?.length" class="mb-6">
      <PageHeaderBlock title-id="resume-preview-experience-title" :title="t('resumePage.experience.title')" extra-class="mb-3" />
      <div
        v-for="(experience, index) in resume.experience"
        :key="`${experience.company}-${experience.title}-${index}`"
        class="mb-4"
      >
        <div class="mb-1 flex items-start justify-between">
          <div>
            <h3 class="text-lg font-bold">{{ experience.title }}</h3>
            <p class="text-base font-semibold">{{ experience.company }}</p>
          </div>
          <div class="text-right text-sm">
            <p>{{ experience.startDate }} - {{ experience.endDate || t("resumePreview.present") }}</p>
            <p v-if="experience.location">{{ experience.location }}</p>
          </div>
        </div>
        <p v-if="experience.description" class="whitespace-pre-wrap text-sm leading-relaxed">
          {{ experience.description }}
        </p>
      </div>
    </div>

    <div v-if="resume.education?.length" class="mb-6">
      <PageHeaderBlock title-id="resume-preview-education-title" :title="t('resumePage.education.title')" extra-class="mb-3" />
      <div
        v-for="(education, index) in resume.education"
        :key="`${education.school}-${education.degree}-${index}`"
        class="mb-3"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-bold">{{ education.degree }}</h3>
            <p class="text-base">{{ education.school }}</p>
          </div>
          <div class="text-right text-sm">
            <p>{{ education.year }}</p>
            <p v-if="education.gpa">{{ t("resumePreview.gpaLabel", { gpa: education.gpa }) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="displaySkills.length" class="mb-6">
      <PageHeaderBlock title-id="resume-preview-skills-title" :title="t('resumePage.skills.title')" extra-class="mb-3" />
      <div class="flex flex-wrap gap-2">
        <span v-for="(skill, index) in displaySkills" :key="`${skill}-${index}`" class="badge badge-outline px-3 py-3 text-sm">
          {{ skill }}
        </span>
      </div>
    </div>

    <div v-if="resume.projects?.length" class="mb-6">
      <PageHeaderBlock title-id="resume-preview-projects-title" :title="t('resumePage.projects.title')" extra-class="mb-3" />
      <div v-for="(project, index) in resume.projects" :key="`${project.title}-${index}`" class="mb-3">
        <h3 class="text-lg font-bold">{{ project.title }}</h3>
        <p v-if="project.link" class="mb-1 text-sm">{{ project.link }}</p>
        <p class="text-sm leading-relaxed">{{ project.description }}</p>
      </div>
    </div>

    <div v-if="hasGamingExperience" class="mb-6">
      <PageHeaderBlock title-id="resume-preview-gaming-title" :title="t('resumePage.gaming.title')" extra-class="mb-3" />
      <div v-if="resume.gamingExperience?.gameEngines" class="mb-2">
        <p class="text-sm font-semibold">{{ t("resumePage.gaming.rolesLegend") }}:</p>
        <p class="text-sm">{{ resume.gamingExperience.gameEngines }}</p>
      </div>
      <div v-if="resume.gamingExperience?.genres" class="mb-2">
        <p class="text-sm font-semibold">{{ t("resumePage.gaming.genresLegend") }}:</p>
        <p class="text-sm">{{ resume.gamingExperience.genres }}</p>
      </div>
      <div v-if="resume.gamingExperience?.shippedTitles">
        <p class="text-sm font-semibold">{{ t("resumePage.gaming.achievementsLegend") }}:</p>
        <ul class="list text-sm">
          <li
            v-for="(achievement, index) in resume.gamingExperience.shippedTitles.split(';')"
            :key="`${achievement}-${index}`"
            class="list-row px-0 py-1"
          >
            {{ achievement.trim() }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
