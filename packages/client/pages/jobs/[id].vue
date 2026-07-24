<script setup lang="ts">
defineOptions({ name: "PagesJobsDetailPage" });

import { MARGIN_TOKEN_CLASS } from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import { readApiGamificationAward } from "~/utils/gamification-response";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { gameGenreLabel, jobExperienceLabel, platformLabel, studioTypeLabel } from "~/utils/labels";
import { formatDateWithLocale } from "~/utils/locale-format";

const route = useRoute();
const router = useRouter();
const { getJob, saveJob, unsaveJob, applyToJob, savedJobs, fetchSavedJobs } = useJobs();
const { $toast } = useNuxtApp();
const { t, locale, fallbackLocale } = useI18n();

useSeoMeta({
  title: t("jobDetail.breadcrumbs.detailFallback"),
  description: t("jobsPage.seoDescription"),
});

const showApplyModal = ref(false);
const applicationNotes = ref("");
const applying = ref(false);
const JOB_APPLY_DIALOG_TITLE_ID = "job-detail-apply-dialog-title";

function routeParamToString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return typeof value === "string" ? value : "";
}

const jobId = computed(() => routeParamToString(route.params.id));

const isSaved = computed(() => {
  return savedJobs.value.some((j) => j.id === jobId.value);
});

// Job detail loading/error: useAsyncData status (handler is side-effect free); useJobs().loading covers save/apply side effects only.
const {
  data: jobDetailData,
  status: jobDetailStatus,
  error: jobDetailError,
  refresh: refreshJobDetail,
} = await useAsyncData(
  () => `job-detail-${jobId.value}`,
  async () => {
    if (!jobId.value) {
      return null;
    }
    const [job] = await Promise.all([getJob(jobId.value), fetchSavedJobs()]);
    return job;
  },
  {
    watch: [jobId],
  },
);

const job = computed(() => jobDetailData.value ?? null);

const breadcrumbs = computed(() => [
  { label: t("jobDetail.breadcrumbs.dashboard"), to: APP_ROUTES.dashboard },
  { label: t("jobDetail.breadcrumbs.jobs"), to: APP_ROUTES.jobs },
  { label: job.value?.title || t("jobDetail.breadcrumbs.detailFallback") },
]);

const jobDetailPending = computed(
  () => jobDetailStatus.value === "pending" || jobDetailStatus.value === "idle",
);

async function handleSaveToggle() {
  if (isSaved.value) {
    const unsaveResult = await settlePromise(
      unsaveJob(jobId.value),
      t("jobDetail.errors.saveFailed"),
    );
    if (!unsaveResult.ok) {
      $toast.error(getErrorMessage(unsaveResult.error, t("jobDetail.errors.saveFailed")));
      return;
    }
    $toast.success(t("jobDetail.toasts.unsaved"));
    return;
  }

  const saveResult = await settlePromise(saveJob(jobId.value), t("jobDetail.errors.saveFailed"));
  if (!saveResult.ok) {
    $toast.error(getErrorMessage(saveResult.error, t("jobDetail.errors.saveFailed")));
    return;
  }
  const saveAward = readApiGamificationAward(saveResult.value);
  $toast.success(
    saveAward
      ? t("jobDetail.toasts.saveReward", { xp: saveAward.xpAwarded })
      : t("jobDetail.toasts.saved"),
  );
}

async function handleApply() {
  applying.value = true;
  const applyResult = await settlePromise(
    applyToJob(jobId.value, applicationNotes.value),
    t("jobDetail.errors.applyFailed"),
  );
  applying.value = false;

  if (!applyResult.ok) {
    $toast.error(getErrorMessage(applyResult.error, t("jobDetail.errors.applyFailed")));
    return;
  }

  showApplyModal.value = false;
  applicationNotes.value = "";
  const applyAward = readApiGamificationAward(applyResult.value);
  $toast.success(
    applyAward
      ? t("jobDetail.toasts.applyReward", { xp: applyAward.xpAwarded })
      : t("jobDetail.toasts.applicationSubmitted"),
  );
}

function formatDate(date: string): string {
  return (
    formatDateWithLocale(date, locale.value, fallbackLocale.value, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) ?? date
  );
}

async function startJobInterview() {
  if (!job.value) return;
  await router.push(buildInterviewJobNavigation(job.value.id, "jobs"));
}

const jobHeroDescription = computed(() => job.value?.company ?? "");
const formatExperienceLabel = (value: string): string => jobExperienceLabel(t, value);
const formatStudioTypeLabel = (value: string): string => studioTypeLabel(t, value);
const formatPlatformLabel = (value: string): string => platformLabel(t, value);
const formatGameGenreLabel = (value: string): string => gameGenreLabel(t, value);
</script>

<template>
  <PageScaffold
    width-token="content"
    spacing-token="comfortable"
    labelled-by="job-detail-title"
  >
    <AppBreadcrumbs :crumbs="breadcrumbs" :class="MARGIN_TOKEN_CLASS.mb6" />

    <LoadingSkeleton v-if="jobDetailPending" :lines="10" />

    <BootstrapErrorAlert
      v-else-if="jobDetailStatus === 'error'"
      :message="getErrorMessage(jobDetailError, t('jobDetail.errors.loadFailed'))"
      :retry-label="t('jobDetail.retryButton')"
      :retry-aria-label="t('jobDetail.retryAria')"
      @retry="() => refreshJobDetail()"
    />

    <EmptyState
      v-else-if="jobDetailStatus === 'success' && !job && jobId"
      title-key="jobDetail.notFoundTitle"
      description-key="jobDetail.notFoundBody"
      cta-label-key="jobDetail.backToJobs"
      :cta-to="APP_ROUTES.jobs"
    />

    <EmptyState
      v-else-if="jobDetailStatus === 'success' && !jobId"
      title-key="jobDetail.invalidIdTitle"
      description-key="jobDetail.invalidIdBody"
      cta-label-key="jobDetail.backToJobs"
      :cta-to="APP_ROUTES.jobs"
    />

    <SectionGrid v-else-if="job" grid-token="threeColumnLg">
      <JobDetailMainContent
        :job="job"
        :is-saved="isSaved"
        title-id="job-detail-title"
        :hero-description="jobHeroDescription"
        :job-experience-label="formatExperienceLabel"
        @save="handleSaveToggle"
        @apply="showApplyModal = true"
        @interview="startJobInterview"
      />

      <JobDetailSidebar
        :job="job"
        :studio-type-label="formatStudioTypeLabel"
        :platform-label="formatPlatformLabel"
        :game-genre-label="formatGameGenreLabel"
        :format-date="formatDate"
      />
    </SectionGrid>

    <JobApplyDialog
      v-model:open="showApplyModal"
      v-model:application-notes="applicationNotes"
      :title-id="JOB_APPLY_DIALOG_TITLE_ID"
      :applying="applying"
      :job-title="job?.title"
      @submit="handleApply"
    />
  </PageScaffold>
</template>
