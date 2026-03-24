<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { gameGenreLabel, jobExperienceLabel, platformLabel, studioTypeLabel } from "~/utils/labels";
import { formatDateWithLocale } from "~/utils/locale-format";

const route = useRoute();
const router = useRouter();
const { getJob, saveJob, unsaveJob, applyToJob, savedJobs } = useJobs();
const { $toast } = useNuxtApp();
const { t, locale, fallbackLocale } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("jobDetail.breadcrumbs.detailFallback"),
    description: t("jobsPage.seoDescription"),
  });
}

const showApplyModal = ref(false);
const applicationNotes = ref("");
const applying = ref(false);
const JOB_APPLY_DIALOG_TITLE_ID = "job-detail-apply-dialog-title";
const JOB_DETAIL_TITLE_ID = "job-detail-title";

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
    return getJob(jobId.value);
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
  $toast.success(t("jobDetail.toasts.saved"));
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
  $toast.success(t("jobDetail.toasts.applicationSubmitted"));
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
</script>

<template>
  <PageScaffold width-token="content" spacing-token="comfortable">
    <AppBreadcrumbs :crumbs="breadcrumbs" class="mb-6" />

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
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Job Header -->
        <div class="card bg-base-200">
          <div class="card-body">
            <PageHeroHeader
              :title-id="JOB_DETAIL_TITLE_ID"
              :title="job.title"
              :description="jobHeroDescription"
              density="comfortable"
            >
              <template #actions>
                <button
                  class="btn btn-outline"
                  :aria-label="t('jobDetail.interviewAria')"
                  @click="startJobInterview"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ t("jobDetail.interviewButton") }}
                </button>

                <button
                  class="btn btn-primary"
                  :aria-label="t('jobDetail.applyAria')"
                  @click="showApplyModal = true"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ t("jobDetail.applyButton") }}
                </button>

                <button
                  class="btn btn-outline"
                  :class="{ 'btn-success': isSaved }"
                  :aria-label="isSaved ? t('jobDetail.unsaveAria') : t('jobDetail.saveAria')"
                  @click="handleSaveToggle"
                >
                  <svg class="h-5 w-5" :fill="isSaved ? 'currentColor' : 'none'" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {{ isSaved ? t("jobDetail.savedButton") : t("jobDetail.saveButton") }}
                </button>
              </template>

              <template v-if="typeof job.matchScore === 'number'" #aside>
                <div class="flex items-center justify-start lg:justify-end">
                  <div class="rounded-box bg-base-100 p-4">
                    <JobMatchScore :score="job.matchScore" />
                    <p class="mt-2 text-center text-xs text-base-content/60">
                      {{ t("jobDetail.matchScoreLabel") }}
                    </p>
                  </div>
                </div>
              </template>
            </PageHeroHeader>

            <div class="mt-4 flex flex-wrap gap-2">
              <span class="badge">
                <svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ job.location }}
              </span>

              <span v-if="job.remote" class="badge badge-success">
                {{ t("jobDetail.remoteBadge") }}
              </span>

              <span v-if="job.experienceLevel" class="badge badge-outline">
                {{ jobExperienceLabel(t, job.experienceLevel) }}
              </span>

              <span v-if="job.salary" class="badge badge-primary">
                {{ job.salary }}
              </span>
            </div>
          </div>
        </div>

        <!-- Job Description -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">{{ t("jobDetail.descriptionTitle") }}</h2>
            <div class="prose max-w-none">
              <p class="whitespace-pre-wrap">{{ job.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="job.requirements?.length" class="divider divider-primary">{{ t("jobDetail.requirementsTitle") }}</div>

        <!-- Requirements -->
        <div v-if="job.requirements?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">{{ t("jobDetail.requirementsTitle") }}</h2>
            <ul class="list">
              <li class="list-row px-0 py-2" v-for="(req, idx) in job.requirements" :key="idx">
                {{ req }}
              </li>
            </ul>
          </div>
        </div>

        <div v-if="job.technologies?.length" class="divider divider-primary">{{ t("jobDetail.technologiesTitle") }}</div>

        <!-- Technologies -->
        <div v-if="job.technologies?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">{{ t("jobDetail.technologiesTitle") }}</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tech in job.technologies"
                :key="tech"
                class="badge badge-lg badge-primary"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Company Info -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">{{ t("jobDetail.companyInfoTitle") }}</h2>

            <div class="space-y-3">
              <div v-if="job.company">
                <p class="text-xs text-base-content/60">{{ t("jobDetail.companyLabel") }}</p>
                <p class="font-medium">{{ job.company }}</p>
              </div>

              <div v-if="job.studioType">
                <p class="text-xs text-base-content/60">{{ t("jobDetail.studioTypeLabel") }}</p>
                <p class="font-medium">{{ studioTypeLabel(t, job.studioType) }}</p>
              </div>

              <div v-if="job.url">
                <p class="text-xs text-base-content/60">{{ t("jobDetail.websiteLabel") }}</p>
                <a :href="job.url" target="_blank" rel="noopener noreferrer" class="link link-primary" :aria-label="t('jobDetail.visitWebsiteAria', { company: job.company })">
                  {{ t("jobDetail.visitWebsiteButton") }}
                </a>
              </div>

              <div v-if="job.postedDate">
                <p class="text-xs text-base-content/60">{{ t("jobDetail.postedLabel") }}</p>
                <p class="font-medium">{{ formatDate(job.postedDate) }}</p>
              </div>
            </div>
          </div>
        </div>



        <!-- Platforms -->
        <div v-if="job.platforms?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">{{ t("jobDetail.platformsTitle") }}</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="platform in job.platforms"
                :key="platform"
                class="badge"
              >
                {{ platformLabel(t, platform) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Genres -->
        <div v-if="job.gameGenres?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">{{ t("jobDetail.genresTitle") }}</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="genre in job.gameGenres"
                :key="genre"
                class="badge"
              >
                {{ gameGenreLabel(t, genre) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SectionGrid>

    <!-- Apply Modal -->
    <AppModalFrame
      v-model:open="showApplyModal"
      :title-id="JOB_APPLY_DIALOG_TITLE_ID"
      size-token="compact"
      :close-aria-label="t('jobDetail.closeApplyDialogAria')"
      :close-backdrop-label="t('jobDetail.closeButton')"
    >
      <h3 :id="JOB_APPLY_DIALOG_TITLE_ID" class="font-bold text-lg mb-4">
        {{ t("jobDetail.applyDialogTitle", { title: job?.title }) }}
      </h3>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("jobDetail.applicationNotesLegend") }}</legend>
        <textarea
          v-model="applicationNotes"
          class="textarea w-full"
          rows="5"
          :placeholder="t('jobDetail.applicationNotesPlaceholder')"
          :aria-label="t('jobDetail.applicationNotesAria')"
        ></textarea>
      </fieldset>

      <div class="modal-action">
        <button
          type="button"
          class="btn btn-ghost"
          :aria-label="t('jobDetail.cancelApplyAria')"
          @click="showApplyModal = false"
        >
          {{ t("jobDetail.cancelButton") }}
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :aria-label="t('jobDetail.submitApplyAria')"
          :disabled="applying"
          @click="handleApply"
        >
          <span v-if="applying" class="loading loading-spinner loading-xs"></span>
          {{ t("jobDetail.submitButton") }}
        </button>
      </div>
    </AppModalFrame>
  </PageScaffold>
</template>
