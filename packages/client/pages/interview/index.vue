<script setup lang="ts">
import {
  APP_ROUTES,
  APP_ROUTE_QUERY_KEYS,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  type InterviewMode,
  type InterviewTargetJob,
  INTERVIEW_FALLBACK_STUDIO_ID,
  INTERVIEW_HUB_EXPERIENCE_OPTIONS,
  INTERVIEW_HUB_JOB_QUERY_LIMIT,
  INTERVIEW_HUB_QUESTION_COUNT_OPTIONS,
  INTERVIEW_HUB_ROLE_OPTIONS,
  INTERVIEW_HUB_RECENT_SESSION_PAGE_SIZE,
  JOB_PREVIEW_LIMIT,
  type Job,
  type VoiceSettings,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

const { sessions, stats, loading, startSession, fetchSessions, fetchStats } = useInterview();
const { studios, searchStudios } = useStudio();
const { jobs, searchJobs, getJob } = useJobs();
const { resumes, fetchResumes } = useResume();
const { coverLetters, fetchCoverLetters } = useCoverLetter();
const { portfolio, fetchPortfolio } = usePortfolio();
const tts = useTTS();
const route = useRoute();
const router = useRouter();
const { $toast } = useNuxtApp();
const { t } = useI18n();

const showConfigModal = ref(false);
const starting = ref(false);
const configDialogRef = ref<HTMLDialogElement | null>(null);
useFocusTrap(configDialogRef, () => showConfigModal.value);
const selectedMode = ref<InterviewMode>("studio");
const selectedJobId = ref("");
const selectedJobFallback = ref<Job | null>(null);
const jobSearchTerm = ref("");
const interviewRoleOptions = ensureOptions(INTERVIEW_HUB_ROLE_OPTIONS, [
  INTERVIEW_DEFAULT_ROLE_TYPE,
]);
const interviewExperienceOptions = ensureOptions(INTERVIEW_HUB_EXPERIENCE_OPTIONS, [
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
]);
const interviewQuestionCountOptions = ensureOptions(INTERVIEW_HUB_QUESTION_COUNT_OPTIONS, [
  INTERVIEW_DEFAULT_QUESTION_COUNT,
]);

function ensureOptions<T>(options: readonly T[], fallbackOptions: readonly T[]): readonly T[] {
  if (Array.isArray(options) && options.length > 0) return options;
  return fallbackOptions;
}

function resolvePreferredOption<T>(options: readonly T[], preferredIndex: number, fallback: T): T {
  const preferredValue = options[preferredIndex];
  if (preferredValue !== undefined) {
    return preferredValue;
  }

  const firstValue = options[0];
  if (firstValue !== undefined) {
    return firstValue;
  }

  return fallback;
}

function queryValueToString(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return typeof value === "string" ? value : "";
}

const sessionConfig = reactive({
  studioId: "",
  role: resolvePreferredOption(interviewRoleOptions, 0, INTERVIEW_DEFAULT_ROLE_TYPE),
  experienceLevel: resolvePreferredOption(
    interviewExperienceOptions,
    1,
    INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  ),
  questionCount: resolvePreferredOption(
    interviewQuestionCountOptions,
    1,
    INTERVIEW_DEFAULT_QUESTION_COUNT,
  ),
  enableVoiceMode: false,
  voiceSettings: {
    ...INTERVIEW_DEFAULT_VOICE_SETTINGS,
    voiceId: "",
  } satisfies VoiceSettings,
});

const routeJobId = computed(() => queryValueToString(route.query[APP_ROUTE_QUERY_KEYS.jobId]));
const routeStudioId = computed(() =>
  queryValueToString(route.query[APP_ROUTE_QUERY_KEYS.studioId]),
);
const requestedMode = computed<InterviewMode>(() =>
  route.query[APP_ROUTE_QUERY_KEYS.mode] === "job" || routeJobId.value ? "job" : "studio",
);

const totalSessions = computed(() => stats.value?.totalSessions ?? 0);
const averageScore = computed(() => Math.round(stats.value?.averageScore ?? 0));
const improvementTrend = computed(() => Math.round(stats.value?.improvementTrend ?? 0));
const recentSessionPagination = usePagination(
  computed(() => sessions.value),
  INTERVIEW_HUB_RECENT_SESSION_PAGE_SIZE,
);
const recentSessions = computed(() => recentSessionPagination.items.value);
const recentSessionsPaginationSummary = computed(() =>
  t("interviewHub.recent.pagination.summary", {
    start: recentSessionPagination.rangeStart.value,
    end: recentSessionPagination.rangeEnd.value,
    total: recentSessionPagination.totalItems.value,
  }),
);

const prepChecklist = computed(() => [
  {
    id: "resume",
    ready: resumes.value.length > 0,
    title: t("interviewHub.prep.items.resume.title"),
    description: t("interviewHub.prep.items.resume.description"),
    ctaLabel: t("interviewHub.prep.items.resume.cta"),
    route: APP_ROUTES.resume,
  },
  {
    id: "coverLetter",
    ready: coverLetters.value.length > 0,
    title: t("interviewHub.prep.items.coverLetter.title"),
    description: t("interviewHub.prep.items.coverLetter.description"),
    ctaLabel: t("interviewHub.prep.items.coverLetter.cta"),
    route: APP_ROUTES.coverLetter,
  },
  {
    id: "portfolio",
    ready: portfolio.value?.projects.length ? portfolio.value.projects.length > 0 : false,
    title: t("interviewHub.prep.items.portfolio.title"),
    description: t("interviewHub.prep.items.portfolio.description"),
    ctaLabel: t("interviewHub.prep.items.portfolio.cta"),
    route: APP_ROUTES.portfolio,
  },
]);

const prepReadyCount = computed(() => prepChecklist.value.filter((item) => item.ready).length);

const prepCompletionPercent = computed(() => {
  const total = prepChecklist.value.length;
  if (total === 0) return 0;
  return Math.round((prepReadyCount.value / total) * 100);
});

const availableJobs = computed(() => {
  const unique = new Map<string, Job>();
  for (const job of jobs.value) {
    unique.set(job.id, job);
  }
  return [...unique.values()];
});

const studiosForSelector = computed(() =>
  studios.value.map((studio) => ({
    id: studio.id,
    name: studio.name,
    type: studio.type,
    location: studio.location,
  })),
);

const searchedJobs = computed(() => {
  const query = jobSearchTerm.value.trim().toLowerCase();
  if (!query) {
    return availableJobs.value;
  }

  return availableJobs.value.filter((job) => {
    const title = job.title.toLowerCase();
    const company = job.company.toLowerCase();
    const description = (job.description || "").toLowerCase();
    return title.includes(query) || company.includes(query) || description.includes(query);
  });
});
const jobSelectionPagination = usePagination(searchedJobs, JOB_PREVIEW_LIMIT, [jobSearchTerm]);
const jobSelectionPaginationSummary = computed(() =>
  t("interviewHub.config.pagination.summary", {
    start: jobSelectionPagination.rangeStart.value,
    end: jobSelectionPagination.rangeEnd.value,
    total: jobSelectionPagination.totalItems.value,
  }),
);

const selectedJob = computed(() => {
  const fromList = availableJobs.value.find((job) => job.id === selectedJobId.value);
  if (fromList) return fromList;
  if (selectedJobFallback.value?.id === selectedJobId.value) return selectedJobFallback.value;
  return null;
});

const selectedStudioName = computed(() => {
  if (!sessionConfig.studioId) return "";
  const selectedStudio = studios.value.find((studio) => studio.id === sessionConfig.studioId);
  return selectedStudio?.name || "";
});

const isStartDisabled = computed(() => {
  if (starting.value) return true;
  if (selectedMode.value === "job") {
    return !selectedJob.value;
  }
  return !sessionConfig.studioId;
});

await useAsyncData("interview-hub-bootstrap", async () => {
  await Promise.all([
    fetchSessions(),
    fetchStats(),
    searchStudios(),
    searchJobs({ limit: INTERVIEW_HUB_JOB_QUERY_LIMIT }),
    fetchResumes(),
    fetchCoverLetters(),
    fetchPortfolio(),
  ]);

  selectedMode.value = requestedMode.value;

  if (routeStudioId.value) {
    sessionConfig.studioId = routeStudioId.value;
  }

  if (routeJobId.value) {
    await selectJobById(routeJobId.value);
  }

  return true;
});

function prepStatusBadgeClass(ready: boolean): string {
  return ready ? "badge-success" : "badge-ghost";
}

function interviewConfigPageAria(page: number): string {
  return t("interviewHub.config.pagination.pageAria", { page });
}

function recentSessionPageAria(page: number): string {
  return t("interviewHub.recent.pagination.pageAria", { page });
}

onMounted(() => {
  if (routeJobId.value || routeStudioId.value) {
    showConfigModal.value = true;
  }
});

watch(showConfigModal, (isOpen) => {
  const dialog = configDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

watch(selectedMode, async (mode) => {
  if (mode === "job" && routeJobId.value && !selectedJob.value) {
    await selectJobById(routeJobId.value);
  }
});

watch(routeStudioId, (studioId) => {
  if (studioId && selectedMode.value === "studio") {
    sessionConfig.studioId = studioId;
  }
});

watch(routeJobId, async (jobId) => {
  if (!jobId) return;
  selectedMode.value = "job";
  await selectJobById(jobId);
});

async function selectJobById(jobId: string) {
  selectedJobId.value = jobId;
  const fromLoadedJobs = availableJobs.value.find((job) => job.id === jobId);
  if (fromLoadedJobs) {
    selectedJobFallback.value = fromLoadedJobs;
    sessionConfig.role = fromLoadedJobs.title;
    return;
  }

  const fetchedJobResult = await settlePromise(
    getJob(jobId),
    t("interviewHub.errors.jobLoadFailed"),
  );
  if (!fetchedJobResult.ok) {
    selectedJobFallback.value = null;
    $toast.error(getErrorMessage(fetchedJobResult.error, t("interviewHub.errors.jobLoadFailed")));
    return;
  }

  if (fetchedJobResult.value) {
    selectedJobFallback.value = fetchedJobResult.value;
    sessionConfig.role = fetchedJobResult.value.title;
  }
}

function openConfig(mode: InterviewMode) {
  selectedMode.value = mode;
  showConfigModal.value = true;
}

function resolveStudioIdForJob(job: Job): string {
  const company = job.company.trim().toLowerCase();
  const matchedStudio = studios.value.find((studio) => {
    const studioName = studio.name.trim().toLowerCase();
    return studioName === company || studioName.includes(company) || company.includes(studioName);
  });

  return matchedStudio?.id || INTERVIEW_FALLBACK_STUDIO_ID;
}

function toTargetJob(job: Job): InterviewTargetJob {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    requirements: job.requirements,
    technologies: job.technologies,
    source: job.source,
    postedDate: job.postedDate,
    url: job.url,
  };
}

function modeLabel(mode: InterviewMode | undefined): string {
  return mode === "job" ? t("interviewHub.mode.job") : t("interviewHub.mode.studio");
}

function roleLabel(role: string): string {
  if (role === "game-designer") return t("interviewHub.roles.gameDesigner");
  if (role === "programmer") return t("interviewHub.roles.programmer");
  if (role === "artist") return t("interviewHub.roles.artist");
  if (role === "producer") return t("interviewHub.roles.producer");
  if (role === "qa") return t("interviewHub.roles.qa");
  return role;
}

function experienceLabel(level: string): string {
  if (level === "entry") return t("interviewHub.experience.entry");
  if (level === "mid") return t("interviewHub.experience.mid");
  if (level === "senior") return t("interviewHub.experience.senior");
  if (level === "lead") return t("interviewHub.experience.lead");
  return level;
}

function questionCountLabel(count: number): string {
  if (count === 3) return t("interviewHub.questionCount.quick");
  if (count === 5) return t("interviewHub.questionCount.standard");
  if (count === 8) return t("interviewHub.questionCount.deep");
  return String(count);
}

async function handleStartInterview() {
  if (isStartDisabled.value) return;

  starting.value = true;
  const startResult = await settlePromise(
    (async () => {
      const activeJob = selectedMode.value === "job" ? selectedJob.value : null;
      const studioId =
        selectedMode.value === "job" && activeJob
          ? resolveStudioIdForJob(activeJob)
          : sessionConfig.studioId;
      const sessionRequestConfig = {
        roleType: activeJob?.title || sessionConfig.role,
        experienceLevel: sessionConfig.experienceLevel,
        questionCount: sessionConfig.questionCount,
        includeTechnical: true,
        includeBehavioral: true,
        includeStudioSpecific: true,
        technologies: activeJob?.technologies || [],
        enableVoiceMode: sessionConfig.enableVoiceMode,
        interviewMode: selectedMode.value,
        ...(sessionConfig.enableVoiceMode ? { voiceSettings: sessionConfig.voiceSettings } : {}),
        ...(activeJob ? { targetJob: toTargetJob(activeJob) } : {}),
      } as const;

      return startSession(studioId, sessionRequestConfig);
    })(),
    t("interviewHub.errors.startFailed"),
  );
  starting.value = false;

  if (!startResult.ok) {
    $toast.error(getErrorMessage(startResult.error, t("interviewHub.errors.startFailed")));
    return;
  }

  if (startResult.value?.id) {
    showConfigModal.value = false;
    $toast.success(t("interviewHub.toasts.started"));
    router.push({
      path: APP_ROUTES.interviewSession,
      query: { [APP_ROUTE_QUERY_KEYS.id]: startResult.value.id },
    });
  }
}

function viewSession(id: string) {
  router.push({
    path: APP_ROUTES.interviewHistory,
    query: { [APP_ROUTE_QUERY_KEYS.sessionId]: id },
  });
}
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6">
    <section class="hero rounded-box bg-base-200 border border-base-300">
      <div class="hero-content w-full flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl space-y-3">
          <h1 class="text-3xl font-bold md:text-4xl">{{ t("interviewHub.title") }}</h1>
          <p class="text-base-content/70">
            {{ t("interviewHub.subtitle") }}
          </p>
          <div class="flex flex-wrap gap-3">
            <button
              class="btn btn-primary"
              :aria-label="t('interviewHub.hero.openJobAria')"
              @click="openConfig('job')"
            >
              {{ t("interviewHub.hero.openJobButton") }}
            </button>
            <button
              class="btn btn-outline"
              :aria-label="t('interviewHub.hero.openStudioAria')"
              @click="openConfig('studio')"
            >
              {{ t("interviewHub.hero.openStudioButton") }}
            </button>
          </div>
        </div>

        <ul class="steps steps-vertical lg:steps-horizontal w-full max-w-xl" :aria-label="t('interviewHub.hero.stepsAria')">
          <li class="step step-primary">{{ t("interviewHub.hero.steps.chooseContext") }}</li>
          <li class="step" :class="showConfigModal ? 'step-primary' : ''">{{ t("interviewHub.hero.steps.configureSession") }}</li>
          <li class="step">{{ t("interviewHub.hero.steps.practiceAndScore") }}</li>
        </ul>
      </div>
    </section>

    <LoadingSkeleton v-if="loading && !stats" :lines="6" />

    <div v-else class="space-y-6">
      <div class="stats stats-vertical lg:stats-horizontal w-full border border-base-300 bg-base-100 shadow-sm">
        <div class="stat">
          <div class="stat-title">{{ t("interviewHub.stats.totalSessionsTitle") }}</div>
          <div class="stat-value text-primary">{{ totalSessions }}</div>
          <div class="stat-desc">{{ t("interviewHub.stats.totalSessionsDesc") }}</div>
        </div>

        <div class="stat">
          <div class="stat-title">{{ t("interviewHub.stats.averageScoreTitle") }}</div>
          <div class="stat-value text-secondary">{{ averageScore }}%</div>
          <div class="stat-desc">{{ t("interviewHub.stats.averageScoreDesc") }}</div>
        </div>

        <div class="stat">
          <div class="stat-title">{{ t("interviewHub.stats.improvementTitle") }}</div>
          <div
            class="stat-value"
            :class="improvementTrend >= 0 ? 'text-success' : 'text-error'"
          >
            {{ improvementTrend >= 0 ? '+' : '' }}{{ improvementTrend }}%
          </div>
          <div class="stat-desc">{{ t("interviewHub.stats.improvementDesc") }}</div>
        </div>
      </div>

      <div class="card card-border bg-base-100">
        <div class="card-body">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="card-title">{{ t("interviewHub.prep.title") }}</h2>
              <p class="text-sm text-base-content/70">{{ t("interviewHub.prep.subtitle") }}</p>
            </div>
            <span class="badge badge-primary badge-outline">
              {{ t("interviewHub.prep.progressLabel", { done: prepReadyCount, total: prepChecklist.length }) }}
            </span>
          </div>

          <progress
            class="progress progress-primary w-full"
            :value="prepCompletionPercent"
            max="100"
            :aria-label="t('interviewHub.prep.progressAria')"
          ></progress>

          <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <article v-for="item in prepChecklist" :key="item.id" class="card bg-base-200">
              <div class="card-body p-4">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="font-semibold">{{ item.title }}</h3>
                  <span class="badge badge-sm" :class="prepStatusBadgeClass(item.ready)">
                    {{ item.ready ? t("interviewHub.prep.readyBadge") : t("interviewHub.prep.pendingBadge") }}
                  </span>
                </div>
                <p class="text-xs text-base-content/70">{{ item.description }}</p>
                <div class="card-actions justify-end">
                  <NuxtLink
                    :to="item.route"
                    class="btn btn-xs btn-outline"
                    :aria-label="t('interviewHub.prep.openAria', { title: item.title })"
                  >
                    {{ item.ctaLabel }}
                  </NuxtLink>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card card-border bg-base-100">
          <div class="card-body">
            <div class="flex items-center justify-between gap-3">
              <h2 class="card-title">{{ t("interviewHub.cards.jobPracticeTitle") }}</h2>
              <span class="badge badge-primary badge-outline">{{ t("interviewHub.cards.recommendedBadge") }}</span>
            </div>
            <p class="text-sm text-base-content/70">
              {{ t("interviewHub.cards.jobPracticeDescription") }}
            </p>
            <div v-if="selectedJob" class="alert alert-info alert-vertical sm:alert-horizontal mt-2">
              <div>
                <h3 class="font-semibold">{{ t("interviewHub.cards.selectedJobTitle") }}</h3>
                <div class="text-xs">{{ t("interviewHub.cards.selectedJobValue", { title: selectedJob.title, company: selectedJob.company }) }}</div>
              </div>
              <button
                class="btn btn-sm"
                :aria-label="t('interviewHub.cards.changeJobAria')"
                @click="openConfig('job')"
              >
                {{ t("interviewHub.cards.changeButton") }}
              </button>
            </div>
            <div class="card-actions justify-end">
              <button
                class="btn btn-primary"
                :aria-label="t('interviewHub.cards.configureJobAria')"
                @click="openConfig('job')"
              >
                {{ t("interviewHub.cards.configureJobButton") }}
              </button>
            </div>
          </div>
        </div>

        <div class="card card-border bg-base-100">
          <div class="card-body">
            <h2 class="card-title">{{ t("interviewHub.cards.studioDrillTitle") }}</h2>
            <p class="text-sm text-base-content/70">
              {{ t("interviewHub.cards.studioDrillDescription") }}
            </p>
            <div v-if="selectedStudioName" class="alert alert-soft mt-2">
              <span>{{ t("interviewHub.cards.currentStudio", { studio: selectedStudioName }) }}</span>
            </div>
            <div class="card-actions justify-end">
              <button
                class="btn btn-outline"
                :aria-label="t('interviewHub.cards.configureStudioAria')"
                @click="openConfig('studio')"
              >
                {{ t("interviewHub.cards.configureStudioButton") }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">{{ t("interviewHub.recent.title") }}</h2>
            <NuxtLink :to="APP_ROUTES.interviewHistory" class="btn btn-ghost btn-sm">{{ t("interviewHub.recent.viewAllButton") }}</NuxtLink>
          </div>

          <div v-if="recentSessions.length === 0" role="alert" class="alert alert-soft">
            <span>{{ t("interviewHub.recent.emptyState") }}</span>
          </div>

          <div v-else class="space-y-4">
            <div class="overflow-x-auto">
              <table class="table" :aria-label="t('interviewHub.recent.tableAria')">
                <thead>
                  <tr>
                    <th>{{ t("interviewHub.recent.columns.context") }}</th>
                    <th>{{ t("interviewHub.recent.columns.role") }}</th>
                    <th>{{ t("interviewHub.recent.columns.mode") }}</th>
                    <th>{{ t("interviewHub.recent.columns.score") }}</th>
                    <th>{{ t("interviewHub.recent.columns.date") }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="session in recentSessions" :key="session.id" class="hover:bg-base-200">
                    <td>{{ session.studioName || session.studioId }}</td>
                    <td>{{ session.role || session.config.roleType }}</td>
                    <td>
                      <span class="badge badge-sm" :class="session.config.interviewMode === 'job' ? 'badge-primary' : 'badge-ghost'">
                        {{ modeLabel(session.config.interviewMode) }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="badge"
                        :class="{
                          'badge-success': (session.score ?? 0) >= 80,
                          'badge-warning': (session.score ?? 0) >= 60 && (session.score ?? 0) < 80,
                          'badge-error': (session.score ?? 0) < 60,
                        }"
                      >
                        {{ session.score ?? 0 }}%
                      </span>
                    </td>
                    <td>{{ session.createdAt ? new Date(session.createdAt).toLocaleDateString() : t("interviewHub.recent.notAvailable") }}</td>
                    <td>
                      <button
                        class="btn btn-ghost btn-xs"
                        :aria-label="t('interviewHub.recent.viewSessionAria', { id: session.id })"
                        @click.stop="viewSession(session.id)"
                      >
                        {{ t("interviewHub.recent.viewButton") }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <AppPagination
              :current-page="recentSessionPagination.currentPage"
              :total-pages="recentSessionPagination.totalPages"
              :page-numbers="recentSessionPagination.pageNumbers"
              :summary="recentSessionsPaginationSummary"
              :navigation-aria="t('interviewHub.recent.pagination.navigationAria')"
              :previous-aria="t('interviewHub.recent.pagination.previousAria')"
              :next-aria="t('interviewHub.recent.pagination.nextAria')"
              :page-aria="recentSessionPageAria"
              @update:current-page="recentSessionPagination.goToPage"
            />
          </div>
        </div>
      </div>
    </div>

    <dialog
      ref="configDialogRef"
      class="modal modal-bottom sm:modal-middle"
      :aria-label="t('interviewHub.config.dialogAria')"
      @close="showConfigModal = false"
    >
      <div class="modal-box w-11/12 max-w-4xl">
        <h3 class="font-bold text-lg">{{ t("interviewHub.config.title") }}</h3>
        <p class="text-sm text-base-content/70 mt-1">
          {{ t("interviewHub.config.subtitle") }}
        </p>

        <div class="join mt-4">
          <button
            type="button"
            class="btn join-item"
            :class="selectedMode === 'job' ? 'btn-primary' : 'btn-outline'"
            :aria-label="t('interviewHub.config.switchToJobAria')"
            @click="selectedMode = 'job'"
          >
            {{ t("interviewHub.config.modeJobButton") }}
          </button>
          <button
            type="button"
            class="btn join-item"
            :class="selectedMode === 'studio' ? 'btn-primary' : 'btn-outline'"
            :aria-label="t('interviewHub.config.switchToStudioAria')"
            @click="selectedMode = 'studio'"
          >
            {{ t("interviewHub.config.modeStudioButton") }}
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div v-if="selectedMode === 'job'" class="space-y-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("interviewHub.config.searchJobsLegend") }}</legend>
              <input
                v-model="jobSearchTerm"
                type="text"
                class="input w-full"
                :placeholder="t('interviewHub.config.searchJobsPlaceholder')"
                :aria-label="t('interviewHub.config.searchJobsAria')"
              />
            </fieldset>

            <div v-if="searchedJobs.length === 0" class="alert alert-soft" role="status">
              <span>{{ t("interviewHub.config.noJobsState") }}</span>
            </div>

            <div v-else class="space-y-4">
              <div class="overflow-x-auto border border-base-300 rounded-box max-h-72">
                <table class="table table-sm" :aria-label="t('interviewHub.config.jobsTableAria')">
                  <thead>
                    <tr>
                      <th>{{ t("interviewHub.config.jobsColumns.job") }}</th>
                      <th>{{ t("interviewHub.config.jobsColumns.company") }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="job in jobSelectionPagination.items" :key="job.id" class="hover:bg-base-200">
                      <td class="max-w-[16rem] truncate">{{ job.title }}</td>
                      <td>{{ job.company }}</td>
                      <td class="text-right">
                        <button
                          type="button"
                          class="btn btn-xs"
                          :class="job.id === selectedJobId ? 'btn-primary' : 'btn-ghost'"
                          :aria-label="t('interviewHub.config.selectJobAria', { title: job.title, company: job.company })"
                          @click="selectJobById(job.id)"
                        >
                          {{ job.id === selectedJobId ? t("interviewHub.config.selectedButton") : t("interviewHub.config.selectButton") }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <AppPagination
                :current-page="jobSelectionPagination.currentPage"
                :total-pages="jobSelectionPagination.totalPages"
                :page-numbers="jobSelectionPagination.pageNumbers"
                :summary="jobSelectionPaginationSummary"
                :navigation-aria="t('interviewHub.config.pagination.navigationAria')"
                :previous-aria="t('interviewHub.config.pagination.previousAria')"
                :next-aria="t('interviewHub.config.pagination.nextAria')"
                :page-aria="interviewConfigPageAria"
                @update:current-page="jobSelectionPagination.goToPage"
              />
            </div>

            <div v-if="selectedJob" class="card bg-base-200" role="status" aria-live="polite">
              <div class="card-body p-4">
                <h4 class="font-semibold">{{ selectedJob.title }}</h4>
                <p class="text-sm text-base-content/70">{{ selectedJob.company }} · {{ selectedJob.location }}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <span v-for="tech in selectedJob.technologies?.slice(0, 6)" :key="tech" class="badge badge-sm badge-outline">
                    {{ tech }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("interviewHub.config.studioLegend") }}</legend>
              <StudioSelector v-model="sessionConfig.studioId" :studios="studiosForSelector" />
              <p v-if="studiosForSelector.length === 0" class="text-xs text-base-content/60 mt-2">
                {{ t("interviewHub.config.noStudiosHint") }}
              </p>
            </fieldset>
          </div>

          <div class="space-y-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("interviewHub.config.roleLegend") }}</legend>
              <input
                v-if="selectedMode === 'job'"
                v-model="sessionConfig.role"
                class="input w-full"
                :aria-label="t('interviewHub.config.roleAria')"
              />
              <select
                v-else
                v-model="sessionConfig.role"
                class="select w-full"
                :aria-label="t('interviewHub.config.roleAria')"
              >
                <option v-for="role in interviewRoleOptions" :key="role" :value="role">
                  {{ roleLabel(role) }}
                </option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("interviewHub.config.experienceLegend") }}</legend>
              <select
                v-model="sessionConfig.experienceLevel"
                class="select w-full"
                :aria-label="t('interviewHub.config.experienceAria')"
              >
                <option
                  v-for="level in interviewExperienceOptions"
                  :key="level"
                  :value="level"
                >
                  {{ experienceLabel(level) }}
                </option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("interviewHub.config.questionCountLegend") }}</legend>
              <select
                v-model="sessionConfig.questionCount"
                class="select w-full"
                :aria-label="t('interviewHub.config.questionCountAria')"
              >
                <option
                  v-for="option in interviewQuestionCountOptions"
                  :key="option"
                  :value="option"
                >
                  {{ questionCountLabel(option) }}
                </option>
              </select>
            </fieldset>

            <label class="label cursor-pointer justify-start gap-3">
              <input
                v-model="sessionConfig.enableVoiceMode"
                type="checkbox"
                class="toggle toggle-primary"
                :aria-label="t('interviewHub.config.enableVoiceAria')"
              />
              <span class="label-text">{{ t("interviewHub.config.enableVoiceLabel") }}</span>
            </label>

            <fieldset v-if="sessionConfig.enableVoiceMode" class="fieldset">
              <legend class="fieldset-legend">{{ t("interviewHub.config.ttsVoiceLegend") }}</legend>
              <select
                v-model="sessionConfig.voiceSettings.voiceId"
                class="select w-full"
                :aria-label="t('interviewHub.config.ttsVoiceAria')"
              >
                <option value="">{{ t("interviewHub.config.ttsDefaultOption") }}</option>
                <option v-for="voice in tts.voices" :key="voice.voiceURI" :value="voice.voiceURI">
                  {{ voice.name }} ({{ voice.lang }})
                </option>
              </select>
            </fieldset>
          </div>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :aria-label="t('interviewHub.config.cancelAria')"
            @click="showConfigModal = false"
          >
            {{ t("interviewHub.config.cancelButton") }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :aria-label="t('interviewHub.config.startAria')"
            :disabled="isStartDisabled"
            @click="handleStartInterview"
          >
            <span v-if="starting" class="loading loading-spinner loading-xs"></span>
            {{ t("interviewHub.config.startButton") }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :aria-label="t('interviewHub.config.closeDialogAria')" @click="showConfigModal = false">
          {{ t("interviewHub.config.closeBackdropButton") }}
        </button>
      </form>
    </dialog>
  </div>
</template>
