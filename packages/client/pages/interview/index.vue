<script setup lang="ts">
import {
  APP_ROUTES,
  APP_ROUTE_QUERY_KEYS,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  type InterviewMode,
  type InterviewTargetJob,
  INTERVIEW_FALLBACK_STUDIO_ID,
  INTERVIEW_HUB_EXPERIENCE_OPTIONS,
  INTERVIEW_HUB_JOB_QUERY_LIMIT,
  INTERVIEW_HUB_QUESTION_COUNT_OPTIONS,
  INTERVIEW_HUB_ROLE_OPTIONS,
  JOB_PREVIEW_LIMIT,
  type Job,
  type VoiceSettings,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";

const { sessions, stats, loading, startSession, fetchSessions, fetchStats } = useInterview();
const { studios, searchStudios } = useStudio();
const { jobs, searchJobs, getJob } = useJobs();
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
const interviewRoleOptions =
  INTERVIEW_HUB_ROLE_OPTIONS?.length > 0
    ? INTERVIEW_HUB_ROLE_OPTIONS
    : [INTERVIEW_DEFAULT_ROLE_TYPE];
const interviewExperienceOptions =
  INTERVIEW_HUB_EXPERIENCE_OPTIONS?.length > 0
    ? INTERVIEW_HUB_EXPERIENCE_OPTIONS
    : [INTERVIEW_DEFAULT_EXPERIENCE_LEVEL];
const interviewQuestionCountOptions =
  INTERVIEW_HUB_QUESTION_COUNT_OPTIONS?.length > 0
    ? INTERVIEW_HUB_QUESTION_COUNT_OPTIONS
    : [INTERVIEW_DEFAULT_QUESTION_COUNT];

function queryValueToString(
  value: string | string[] | null | undefined,
): string {
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return typeof value === "string" ? value : "";
}

const sessionConfig = reactive({
  studioId: "",
  role: interviewRoleOptions[0] ?? INTERVIEW_DEFAULT_ROLE_TYPE,
  experienceLevel:
    interviewExperienceOptions[1] ??
    interviewExperienceOptions[0] ??
    INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  questionCount:
    interviewQuestionCountOptions[1] ??
    interviewQuestionCountOptions[0] ??
    INTERVIEW_DEFAULT_QUESTION_COUNT,
  enableVoiceMode: false,
  voiceSettings: {
    voiceId: "",
    rate: 1,
    pitch: 1,
    volume: 1,
    language: "en-US",
  } satisfies VoiceSettings,
});

const routeJobId = computed(() =>
  queryValueToString(route.query[APP_ROUTE_QUERY_KEYS.jobId]),
);
const routeStudioId = computed(() =>
  queryValueToString(route.query[APP_ROUTE_QUERY_KEYS.studioId]),
);
const requestedMode = computed<InterviewMode>(() =>
  route.query[APP_ROUTE_QUERY_KEYS.mode] === "job" || routeJobId.value
    ? "job"
    : "studio",
);

const totalSessions = computed(() => stats.value?.totalSessions ?? 0);
const averageScore = computed(() => Math.round(stats.value?.averageScore ?? 0));
const improvementTrend = computed(() => Math.round(stats.value?.improvementTrend ?? 0));
const recentSessions = computed(() => sessions.value.slice(0, 6));

const availableJobs = computed(() => {
  const unique = new Map<string, Job>();
  for (const job of jobs.value) {
    unique.set(job.id, job);
  }
  return [...unique.values()];
});

const filteredJobs = computed(() => {
  const query = jobSearchTerm.value.trim().toLowerCase();
  if (!query) {
    return availableJobs.value.slice(0, JOB_PREVIEW_LIMIT);
  }

  return availableJobs.value
    .filter((job) => {
      const title = job.title.toLowerCase();
      const company = job.company.toLowerCase();
      const description = (job.description || "").toLowerCase();
      return title.includes(query) || company.includes(query) || description.includes(query);
    })
    .slice(0, JOB_PREVIEW_LIMIT);
});

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

watch(
  routeJobId,
  async (jobId) => {
    if (!jobId) return;
    selectedMode.value = "job";
    await selectJobById(jobId);
  },
);

async function selectJobById(jobId: string) {
  selectedJobId.value = jobId;
  const fromLoadedJobs = availableJobs.value.find((job) => job.id === jobId);
  if (fromLoadedJobs) {
    selectedJobFallback.value = fromLoadedJobs;
    sessionConfig.role = fromLoadedJobs.title;
    return;
  }

  try {
    const fetched = await getJob(jobId);
    if (fetched) {
      selectedJobFallback.value = fetched;
      sessionConfig.role = fetched.title;
    }
  } catch {
    selectedJobFallback.value = null;
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
    return (
      studioName === company ||
      studioName.includes(company) ||
      company.includes(studioName)
    );
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

  try {
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

    const session = await startSession(studioId, sessionRequestConfig);

    if (session?.id) {
      showConfigModal.value = false;
      $toast.success(t("interviewHub.toasts.started"));
      router.push({
        path: APP_ROUTES.interviewSession,
        query: { [APP_ROUTE_QUERY_KEYS.id]: session.id },
      });
    }
  } catch (error) {
    $toast.error(getErrorMessage(error, t("interviewHub.errors.startFailed")));
  } finally {
    starting.value = false;
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
  <div class="space-y-6">
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

          <div v-else class="overflow-x-auto">
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
                  <tr v-for="job in filteredJobs" :key="job.id" class="hover:bg-base-200">
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
              <select
                v-model="sessionConfig.studioId"
                class="select w-full"
                :aria-label="t('interviewHub.config.studioAria')"
              >
                <option value="">{{ t("interviewHub.config.selectStudioOption") }}</option>
                <option v-for="studio in studios" :key="studio.id" :value="studio.id">
                  {{ studio.name }}
                </option>
              </select>
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
