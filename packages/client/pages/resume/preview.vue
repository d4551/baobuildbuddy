<script setup lang="ts">
import { APP_ROUTES, APP_ROUTE_QUERY_KEYS, type ResumeData } from "@bao/shared";
import { useAsyncData, useRoute, useRouter, useServerSeoMeta } from "#imports";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { getResume, exportResume, loading } = useResume();
const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("resumePreview.pageTitle"),
    description: t("resumePreview.description"),
  });
}

const pageError = ref<string | null>(null);
const resumeId = computed(() => {
  const routeResumeId = route.query[APP_ROUTE_QUERY_KEYS.id];
  return typeof routeResumeId === "string" ? routeResumeId : "";
});

const resumePreviewKey = computed(() =>
  `resume-preview:${resumeId.value.length > 0 ? resumeId.value : "missing"}`
);

const { data: resume, pending: bootstrapPending, refresh: refreshResumePreview } =
  await useAsyncData<ResumeData | null>(
    resumePreviewKey,
    async () => {
      pageError.value = null;

      if (!resumeId.value) {
        return null;
      }

      const resumeResult = await settlePromise(
        getResume(resumeId.value),
        t("resumePreview.loadError"),
      );
      if (!resumeResult.ok) {
        pageError.value = getErrorMessage(resumeResult.error, t("resumePreview.loadError"));
        return null;
      }

      return resumeResult.value;
    },
    {
      watch: [resumeId],
    },
  );

const displaySkills = computed(() => {
  if (!resume.value?.skills) return [];
  const { technical = [], soft = [], gaming = [] } = resume.value.skills;
  return [...technical, ...soft, ...gaming];
});

const hasGamingExperience = computed(() => {
  const gamingExperience = resume.value?.gamingExperience;
  return Boolean(
    gamingExperience?.gameEngines ||
      gamingExperience?.genres ||
      gamingExperience?.shippedTitles,
  );
});

async function handleExport() {
  if (!resumeId.value) {
    return;
  }

  await exportResume(resumeId.value);
}

function handlePrint() {
  window.print();
}
</script>

<template>
  <PageScaffold
    tag="section"
    width-token="content"
    spacing-token="comfortable"
    labelled-by="resume-preview-title"
  >
    <PageHeroHeader
      title-id="resume-preview-title"
      :title="t('resumePreview.pageTitle')"
      :description="t('resumePreview.description')"
    >
      <template #actions>
        <button
          class="btn btn-ghost print:hidden"
          :aria-label="t('resumePage.backButtonAria')"
          @click="router.back()"
        >
          <IconArrowLeft class="h-4 w-4" />
          {{ t("resumePage.backButton") }}
        </button>

        <button
          class="btn btn-outline print:hidden"
          :aria-label="t('resumePreview.printAria')"
          @click="handlePrint"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {{ t("resumePreview.printButton") }}
        </button>

        <button
          class="btn btn-primary print:hidden"
          :aria-label="t('resumePage.exportButtonAria')"
          @click="handleExport"
        >
          <IconDownload class="h-4 w-4" />
          {{ t("resumePage.exportButton") }}
        </button>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="bootstrapPending || loading" :lines="10" />

    <BootstrapErrorAlert
      v-else-if="pageError"
      :title="t('resumePreview.pageTitle')"
      :message="pageError"
      :retry-label="t('resumePreview.retryButton')"
      :retry-aria-label="t('resumePreview.retryAria')"
      @retry="() => refreshResumePreview()"
    />

    <EmptyState
      v-else-if="!resume"
      title-key="resumePreview.notFoundTitle"
      description-key="resumePreview.notFoundDescription"
      cta-label-key="resumePage.backButton"
      :cta-to="APP_ROUTES.resume"
    />

    <div
      v-else
      class="mx-auto max-w-4xl rounded-box border border-base-300 bg-base-100 p-8 text-base-content shadow-lg print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <div class="mb-8 border-b-2 border-base-content/30 pb-4 text-center">
        <h2 class="mb-2 text-4xl font-bold">
          {{ resume.personalInfo?.name || t("resumePreview.defaultName") }}
        </h2>
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
        <PageHeaderBlock
          title-id="resume-preview-summary-title"
          :title="t('resumePage.personal.summaryLegend')"
          extra-class="mb-3"
        />
        <p class="text-sm leading-relaxed">{{ resume.summary }}</p>
      </div>

      <div v-if="resume.experience?.length" class="mb-6">
        <PageHeaderBlock
          title-id="resume-preview-experience-title"
          :title="t('resumePage.experience.title')"
          extra-class="mb-3"
        />
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
        <PageHeaderBlock
          title-id="resume-preview-education-title"
          :title="t('resumePage.education.title')"
          extra-class="mb-3"
        />
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
        <PageHeaderBlock
          title-id="resume-preview-skills-title"
          :title="t('resumePage.skills.title')"
          extra-class="mb-3"
        />
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(skill, index) in displaySkills"
            :key="`${skill}-${index}`"
            class="badge badge-outline px-3 py-3 text-sm"
          >
            {{ skill }}
          </span>
        </div>
      </div>

      <div v-if="resume.projects?.length" class="mb-6">
        <PageHeaderBlock
          title-id="resume-preview-projects-title"
          :title="t('resumePage.projects.title')"
          extra-class="mb-3"
        />
        <div
          v-for="(project, index) in resume.projects"
          :key="`${project.title}-${index}`"
          class="mb-3"
        >
          <h3 class="text-lg font-bold">{{ project.title }}</h3>
          <p v-if="project.link" class="mb-1 text-sm">
            {{ project.link }}
          </p>
          <p class="text-sm leading-relaxed">{{ project.description }}</p>
        </div>
      </div>

      <div v-if="hasGamingExperience" class="mb-6">
        <PageHeaderBlock
          title-id="resume-preview-gaming-title"
          :title="t('resumePage.gaming.title')"
          extra-class="mb-3"
        />
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
  </PageScaffold>
</template>
