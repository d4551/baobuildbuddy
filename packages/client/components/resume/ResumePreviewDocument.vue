<script setup lang="ts">
import type { ResumeData } from "@bao/shared/types/resume";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  INSET_PANEL_CLASS,
  LEADING_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  PRINT_PADDING_RESET_CLASS,
  SHADOW_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_OUTLINE_CLASS,
} from "~/constants/layout-badges";

defineProps<{
  resume: ResumeData;
  displaySkills: readonly string[];
  hasGamingExperience: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="mx-auto max-w-4xl text-base-content print:rounded-none print:border-0" :class="[INSET_PANEL_CLASS, PRINT_PADDING_RESET_CLASS, PADDING_TOKEN_CLASS.p8, SHADOW_TOKEN_CLASS.lg, SHADOW_TOKEN_CLASS.printNone]"
  >
    <div class="border-b-2 border-base-content/30 text-center" :class="[MARGIN_TOKEN_CLASS.mb8, PADDING_TOKEN_CLASS.pb4]">
      <h2 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb2, TYPOGRAPHY_SCALE_CLASS.xl4]">{{ resume.personalInfo?.name || t("resumePreview.defaultName") }}</h2>
      <div class="flex flex-wrap justify-center" :class="[FLEX_GAP_TOKEN_CLASS.gap4, TYPOGRAPHY_SCALE_CLASS.sm]">
        <span v-if="resume.personalInfo?.email">{{ resume.personalInfo.email }}</span>
        <span v-if="resume.personalInfo?.phone">{{ resume.personalInfo.phone }}</span>
        <span v-if="resume.personalInfo?.location">{{ resume.personalInfo.location }}</span>
      </div>
      <div
        v-if="resume.personalInfo?.linkedIn || resume.personalInfo?.portfolio"
        class="flex flex-wrap justify-center" :class="[FLEX_GAP_TOKEN_CLASS.gap4, MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]"
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

    <div v-if="resume.summary" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <PageHeaderBlock
        title-id="resume-preview-summary-title"
        :title="t('resumePage.personal.summaryLegend')"
        heading-tag="h2"
        :class="[MARGIN_TOKEN_CLASS.mb3]"
      />
      <p :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.sm]">{{ resume.summary }}</p>
    </div>

    <div v-if="resume.experience?.length" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <PageHeaderBlock
        title-id="resume-preview-experience-title"
        :title="t('resumePage.experience.title')"
        heading-tag="h2"
        :class="[MARGIN_TOKEN_CLASS.mb3]"
      />
      <div
        v-for="(experience, index) in resume.experience"
        :key="`${experience.company}-${experience.title}-${index}`"
        :class="[MARGIN_TOKEN_CLASS.mb4]"
      >
        <div class="flex items-start justify-between" :class="[MARGIN_TOKEN_CLASS.mb1]">
          <div>
            <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">{{ experience.title }}</h3>
            <p class="text-base font-semibold">{{ experience.company }}</p>
          </div>
          <div class="text-end" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            <p>{{ experience.startDate }} - {{ experience.endDate || t("resumePreview.present") }}</p>
            <p v-if="experience.location">{{ experience.location }}</p>
          </div>
        </div>
        <p v-if="experience.description" class="whitespace-pre-wrap" :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ experience.description }}
        </p>
      </div>
    </div>

    <div v-if="resume.education?.length" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <PageHeaderBlock
        title-id="resume-preview-education-title"
        :title="t('resumePage.education.title')"
        heading-tag="h2"
        :class="[MARGIN_TOKEN_CLASS.mb3]"
      />
      <div
        v-for="(education, index) in resume.education"
        :key="`${education.school}-${education.degree}-${index}`"
        :class="[MARGIN_TOKEN_CLASS.mb3]"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">{{ education.degree }}</h3>
            <p class="text-base">{{ education.school }}</p>
          </div>
          <div class="text-end" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            <p>{{ education.year }}</p>
            <p v-if="education.gpa">{{ t("resumePreview.gpaLabel", { gpa: education.gpa }) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="displaySkills.length" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <PageHeaderBlock
        title-id="resume-preview-skills-title"
        :title="t('resumePage.skills.title')"
        heading-tag="h2"
        :class="[MARGIN_TOKEN_CLASS.mb3]"
      />
      <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
        <span v-for="(skill, index) in displaySkills" :key="`${skill}-${index}`" :class="[BADGE_OUTLINE_CLASS, PADDING_TOKEN_CLASS.px3, PADDING_TOKEN_CLASS.py3, TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ skill }}
        </span>
      </div>
    </div>

    <div v-if="resume.projects?.length" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <PageHeaderBlock
        title-id="resume-preview-projects-title"
        :title="t('resumePage.projects.title')"
        heading-tag="h2"
        :class="[MARGIN_TOKEN_CLASS.mb3]"
      />
      <div v-for="(project, index) in resume.projects" :key="`${project.title}-${index}`" :class="[MARGIN_TOKEN_CLASS.mb3]">
        <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">{{ project.title }}</h3>
        <p v-if="project.link" :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.sm]">{{ project.link }}</p>
        <p :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.sm]">{{ project.description }}</p>
      </div>
    </div>

    <div v-if="hasGamingExperience" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <PageHeaderBlock
        title-id="resume-preview-gaming-title"
        :title="t('resumePage.gaming.title')"
        heading-tag="h2"
        :class="[MARGIN_TOKEN_CLASS.mb3]"
      />
      <div v-if="resume.gamingExperience?.gameEngines" :class="[MARGIN_TOKEN_CLASS.mb2]">
        <p class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("resumePage.gaming.rolesLegend") }}:</p>
        <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ resume.gamingExperience.gameEngines }}</p>
      </div>
      <div v-if="resume.gamingExperience?.genres" :class="[MARGIN_TOKEN_CLASS.mb2]">
        <p class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("resumePage.gaming.genresLegend") }}:</p>
        <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ resume.gamingExperience.genres }}</p>
      </div>
      <div v-if="resume.gamingExperience?.shippedTitles">
        <p class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("resumePage.gaming.achievementsLegend") }}:</p>
        <ul class="list" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          <li
            v-for="(achievement, index) in resume.gamingExperience.shippedTitles.split(';')"
            :key="`${achievement}-${index}`"
            class="list-row" :class="[PADDING_TOKEN_CLASS.px0, PADDING_TOKEN_CLASS.py1]"
          >
            {{ achievement.trim() }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
