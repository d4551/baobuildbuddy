<script setup lang="ts">
import { RESUME_EXPORT_THEME_CONFIGS } from "@bao/shared/constants/export-layout";
import type { ResumeData } from "@bao/shared/types/resume";
import { resolveResumeExportTemplate } from "@bao/shared/utils/export-contract";
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

const props = defineProps<{
  resume: ResumeData;
  displaySkills: readonly string[];
  hasGamingExperience: boolean;
}>();

const { t } = useI18n();

const theme = computed(() => {
  const template = resolveResumeExportTemplate(props.resume.template, "modern");
  return RESUME_EXPORT_THEME_CONFIGS[template].pdf;
});

const toCssRgb = (color: { r: number; g: number; b: number }): string =>
  `rgb(${Math.round(color.r * 255)} ${Math.round(color.g * 255)} ${Math.round(color.b * 255)})`;

const shellStyle = computed(() => ({
  backgroundColor: toCssRgb(theme.value.colors.background),
  color: toCssRgb(theme.value.colors.text),
  "--resume-preview-primary": toCssRgb(theme.value.colors.primary),
  "--resume-preview-accent": toCssRgb(theme.value.colors.accent),
  "--resume-preview-secondary": toCssRgb(theme.value.colors.secondary),
}));

const headerClass = computed(() => {
  const align =
    theme.value.layout.headerStyle === "left-aligned" ? "text-start" : "text-center";
  const banner =
    theme.value.layout.headerStyle === "banner"
      ? "rounded-box px-4 py-4"
      : "border-b-2";
  return [align, banner, MARGIN_TOKEN_CLASS.mb8, PADDING_TOKEN_CLASS.pb4];
});

const headerStyle = computed(() => {
  if (theme.value.layout.headerStyle === "banner") {
    return {
      backgroundColor: toCssRgb(theme.value.colors.primary),
      color: toCssRgb(theme.value.colors.text),
      borderColor: toCssRgb(theme.value.colors.accent),
    };
  }
  if (theme.value.layout.dividerStyle === "accent-bar") {
    return {
      borderColor: toCssRgb(theme.value.colors.accent),
      borderBottomWidth: "6px",
    };
  }
  return { borderColor: toCssRgb(theme.value.colors.secondary) };
});

const sectionTitleStyle = computed(() => ({
  color: toCssRgb(theme.value.colors.primary),
}));

const skillsClass = computed(() =>
  theme.value.layout.skillsLayout === "2-column"
    ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
    : "flex flex-wrap",
);
</script>

<template>
  <div
    class="mx-auto max-w-4xl print:rounded-none print:border-0"
    :class="[INSET_PANEL_CLASS, PRINT_PADDING_RESET_CLASS, PADDING_TOKEN_CLASS.p8, SHADOW_TOKEN_CLASS.lg, SHADOW_TOKEN_CLASS.printNone]"
    :style="shellStyle"
    :data-resume-export-template="resume.template || 'modern'"
  >
    <div :class="headerClass" :style="headerStyle">
      <h2 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb2, TYPOGRAPHY_SCALE_CLASS.xl4]">{{ resume.personalInfo?.name || t("resumePreview.defaultName") }}</h2>
      <div class="flex flex-wrap" :class="[theme.layout.headerStyle === 'left-aligned' ? 'justify-start' : 'justify-center', FLEX_GAP_TOKEN_CLASS.gap4, TYPOGRAPHY_SCALE_CLASS.sm]">
        <span v-if="resume.personalInfo?.email">{{ resume.personalInfo.email }}</span>
        <span v-if="resume.personalInfo?.phone">{{ resume.personalInfo.phone }}</span>
        <span v-if="resume.personalInfo?.location">{{ resume.personalInfo.location }}</span>
      </div>
      <div
        v-if="resume.personalInfo?.linkedIn || resume.personalInfo?.portfolio"
        class="flex flex-wrap" :class="[theme.layout.headerStyle === 'left-aligned' ? 'justify-start' : 'justify-center', FLEX_GAP_TOKEN_CLASS.gap4, MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]"
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
      <h2
        id="resume-preview-summary-title"
        :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.xl]"
        :style="sectionTitleStyle"
      >{{ t("resumePage.personal.summaryLegend") }}</h2>
      <p :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.sm]">{{ resume.summary }}</p>
    </div>

    <div v-if="resume.experience?.length" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <h2
        id="resume-preview-experience-title"
        :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.xl]"
        :style="sectionTitleStyle"
      >{{ t("resumePage.experience.title") }}</h2>
      <div
        v-for="(experience, index) in resume.experience"
        :key="`${experience.company}-${experience.title}-${index}`"
        :class="[MARGIN_TOKEN_CLASS.mb4]"
      >
        <div class="flex items-start justify-between" :class="[MARGIN_TOKEN_CLASS.mb1]">
          <div>
            <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">{{ experience.title }}</h3>
            <p class="text-base font-semibold" :style="{ color: 'var(--resume-preview-accent)' }">{{ experience.company }}</p>
          </div>
          <div class="text-end" :class="[TYPOGRAPHY_SCALE_CLASS.sm]" :style="{ color: 'var(--resume-preview-secondary)' }">
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
      <h2
        id="resume-preview-education-title"
        :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.xl]"
        :style="sectionTitleStyle"
      >{{ t("resumePage.education.title") }}</h2>
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
      <h2
        id="resume-preview-skills-title"
        :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.xl]"
        :style="sectionTitleStyle"
      >{{ t("resumePage.skills.title") }}</h2>
      <div :class="[skillsClass, FLEX_GAP_TOKEN_CLASS.gap2]">
        <span v-for="(skill, index) in displaySkills" :key="`${skill}-${index}`" :class="[BADGE_OUTLINE_CLASS, PADDING_TOKEN_CLASS.px3, PADDING_TOKEN_CLASS.py3, TYPOGRAPHY_SCALE_CLASS.sm]" :style="{ borderColor: 'var(--resume-preview-primary)', color: 'var(--resume-preview-primary)' }">
          {{ skill }}
        </span>
      </div>
    </div>

    <div v-if="resume.projects?.length" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <h2
        id="resume-preview-projects-title"
        :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.xl]"
        :style="sectionTitleStyle"
      >{{ t("resumePage.projects.title") }}</h2>
      <div v-for="(project, index) in resume.projects" :key="`${project.title}-${index}`" :class="[MARGIN_TOKEN_CLASS.mb3]">
        <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">{{ project.title }}</h3>
        <p v-if="project.link" :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.sm]">{{ project.link }}</p>
        <p :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.sm]">{{ project.description }}</p>
      </div>
    </div>

    <div v-if="hasGamingExperience" :class="[MARGIN_TOKEN_CLASS.mb6]">
      <h2
        id="resume-preview-gaming-title"
        :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.xl]"
        :style="sectionTitleStyle"
      >{{ t("resumePage.gaming.title") }}</h2>
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
