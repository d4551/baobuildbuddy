<script setup lang="ts">
import { APP_ROUTES, JOB_PREVIEW_LIMIT, SCRAPER_JOB_QUERY_LIMIT } from "@bao/shared";
import type { Job } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { getErrorMessage } from "~/utils/errors";

type RunState = "idle" | "running" | "success" | "error";

const studiosFetch = useFetch("/api/scraper/studios", {
  method: "POST",
  immediate: false,
});

const jobsFetch = useFetch("/api/scraper/jobs/gamedev", {
  method: "POST",
  immediate: false,
});

const { jobs, searchJobs, loading: jobsLoading } = useJobs();
const router = useRouter();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const { awardForAction } = usePipelineGamification();

const studioState = ref<RunState>("idle");
const jobState = ref<RunState>("idle");
const studioMessage = ref("");
const jobMessage = ref("");
const studioLastRunAt = ref<string | null>(null);
const jobLastRunAt = ref<string | null>(null);

await useAsyncData("automation-scraper-jobs", async () => {
  await searchJobs({ limit: SCRAPER_JOB_QUERY_LIMIT });
  return true;
});

const sortedJobs = computed(() => {
  const rows = [...jobs.value];
  rows.sort((a, b) => {
    const aTime = new Date(a.postedDate).getTime();
    const bTime = new Date(b.postedDate).getTime();
    return bTime - aTime;
  });
  return rows;
});

const topJobs = computed<Job[]>(() => sortedJobs.value.slice(0, JOB_PREVIEW_LIMIT));
const jobCount = computed(() => sortedJobs.value.length);

function formatRunTime(value: string | null): string {
  if (!value) return t("automation.scraper.notRunYet");
  return new Date(value).toLocaleString();
}

function relativePostedDate(date: string): string {
  const postedDate = new Date(date);
  if (Number.isNaN(postedDate.getTime())) return t("automation.scraper.unknownPostedDate");

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return t("automation.scraper.today");
  if (diffDays === 1) return t("automation.scraper.yesterday");
  if (diffDays < 7) return t("automation.scraper.daysAgo", { count: diffDays });
  if (diffDays < 30) return t("automation.scraper.weeksAgo", { count: Math.floor(diffDays / 7) });
  return t("automation.scraper.monthsAgo", { count: Math.floor(diffDays / 30) });
}

async function refreshJobsFeed() {
  await searchJobs({ limit: SCRAPER_JOB_QUERY_LIMIT });
}

function runStateLabel(state: RunState): string {
  if (state === "running") return t("automation.scraper.state.running");
  if (state === "success") return t("automation.scraper.state.success");
  if (state === "error") return t("automation.scraper.state.error");
  return t("automation.scraper.state.idle");
}

async function runStudios() {
  studioState.value = "running";
  studioMessage.value = "";

  await studiosFetch.refresh();

  if (studiosFetch.error.value) {
    studioState.value = "error";
    studioMessage.value = getErrorMessage(
      studiosFetch.error.value,
      t("automation.scraper.errors.studioFailed"),
    );
    return;
  }

  studioState.value = "success";
  studioLastRunAt.value = new Date().toISOString();
  const studioReward = await resolvePipelineReward("scraperStudios");
  studioMessage.value = studioReward
    ? t("automation.scraper.messages.studioCompletedWithXp", { xp: studioReward })
    : t("automation.scraper.messages.studioCompleted");
  if (studioReward) {
    $toast.success(t("automation.scraper.toasts.studioReward", { xp: studioReward }));
  }
}

async function runJobs() {
  jobState.value = "running";
  jobMessage.value = "";

  await jobsFetch.refresh();

  if (jobsFetch.error.value) {
    jobState.value = "error";
    jobMessage.value = getErrorMessage(
      jobsFetch.error.value,
      t("automation.scraper.errors.jobFailed"),
    );
    return;
  }

  await refreshJobsFeed();
  jobState.value = "success";
  jobLastRunAt.value = new Date().toISOString();
  const jobReward = await resolvePipelineReward("scraperJobs");
  jobMessage.value = jobReward
    ? t("automation.scraper.messages.jobCompletedWithXp", { xp: jobReward })
    : t("automation.scraper.messages.jobCompleted");
  if (jobReward) {
    $toast.success(t("automation.scraper.toasts.jobReward", { xp: jobReward }));
  }
}

function startJobInterview(jobId: string) {
  router.push(buildInterviewJobNavigation(jobId, "scraper"));
}

async function resolvePipelineReward(
  action: "scraperStudios" | "scraperJobs",
): Promise<number | null> {
  try {
    const reward = await awardForAction(action);
    return reward.awarded ? reward.amount : null;
  } catch {
    // Scraper completion feedback must remain stable without gamification.
    return null;
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="hero rounded-box bg-base-200 border border-base-300">
      <div class="hero-content w-full flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl space-y-3">
          <h1 class="text-3xl font-bold md:text-4xl">{{ t("automation.scraper.title") }}</h1>
          <p class="text-base-content/70">
            {{ t("automation.scraper.subtitle") }}
          </p>
        </div>
        <ul class="steps steps-vertical lg:steps-horizontal w-full max-w-xl" :aria-label="t('automation.scraper.stepsAria')">
          <li class="step step-primary">{{ t("automation.scraper.steps.run") }}</li>
          <li class="step">{{ t("automation.scraper.steps.review") }}</li>
          <li class="step">{{ t("automation.scraper.steps.interview") }}</li>
        </ul>
      </div>
    </section>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div class="card card-border bg-base-100">
        <div class="card-body">
          <div class="flex items-center justify-between gap-3">
            <h2 class="card-title">{{ t("automation.scraper.studioCard.title") }}</h2>
            <span class="badge" :class="studioState === 'success' ? 'badge-success' : studioState === 'error' ? 'badge-error' : 'badge-ghost'">
              {{ runStateLabel(studioState) }}
            </span>
          </div>
          <p class="text-sm text-base-content/70">
            {{ t("automation.scraper.studioCard.description") }}
          </p>
          <p class="text-xs text-base-content/60">
            {{ t("automation.scraper.lastRunLabel", { value: formatRunTime(studioLastRunAt) }) }}
          </p>

          <div class="card-actions justify-end">
            <button
              class="btn btn-primary"
              :aria-label="t('automation.scraper.studioCard.runAria')"
              :disabled="studioState === 'running'"
              @click="runStudios"
            >
              <span v-if="studioState === 'running'" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ t("automation.scraper.studioCard.runButton") }}</span>
            </button>
          </div>

          <div v-if="studioState !== 'idle'" class="mt-2">
            <div
              v-if="studioState === 'success'"
              role="alert"
              class="alert alert-success alert-vertical sm:alert-horizontal"
            >
              <span>{{ studioMessage }}</span>
            </div>
            <div
              v-else-if="studioState === 'error'"
              role="alert"
              class="alert alert-error alert-vertical sm:alert-horizontal"
            >
              <span>{{ studioMessage }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100">
        <div class="card-body">
          <div class="flex items-center justify-between gap-3">
            <h2 class="card-title">{{ t("automation.scraper.jobCard.title") }}</h2>
            <span class="badge" :class="jobState === 'success' ? 'badge-success' : jobState === 'error' ? 'badge-error' : 'badge-ghost'">
              {{ runStateLabel(jobState) }}
            </span>
          </div>
          <p class="text-sm text-base-content/70">
            {{ t("automation.scraper.jobCard.description") }}
          </p>
          <p class="text-xs text-base-content/60">
            {{ t("automation.scraper.lastRunLabel", { value: formatRunTime(jobLastRunAt) }) }}
          </p>

          <div class="card-actions justify-end">
            <button
              class="btn btn-primary"
              :aria-label="t('automation.scraper.jobCard.runAria')"
              :disabled="jobState === 'running'"
              @click="runJobs"
            >
              <span v-if="jobState === 'running'" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ t("automation.scraper.jobCard.runButton") }}</span>
            </button>
          </div>

          <div v-if="jobState !== 'idle'" class="mt-2">
            <div
              v-if="jobState === 'success'"
              role="alert"
              class="alert alert-success alert-vertical sm:alert-horizontal"
            >
              <span>{{ jobMessage }}</span>
            </div>
            <div
              v-else-if="jobState === 'error'"
              role="alert"
              class="alert alert-error alert-vertical sm:alert-horizontal"
            >
              <span>{{ jobMessage }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats stats-vertical lg:stats-horizontal w-full border border-base-300 bg-base-100 shadow-sm">
      <div class="stat">
        <div class="stat-title">{{ t("automation.scraper.stats.availableJobsTitle") }}</div>
        <div class="stat-value text-primary">{{ jobCount }}</div>
        <div class="stat-desc">{{ t("automation.scraper.stats.availableJobsDescription") }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">{{ t("automation.scraper.stats.jobStatusTitle") }}</div>
        <div class="stat-value text-lg">{{ runStateLabel(jobState) }}</div>
        <div class="stat-desc">{{ t("automation.scraper.stats.jobStatusDescription") }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">{{ t("automation.scraper.stats.interviewEntryTitle") }}</div>
        <div class="stat-value text-lg">{{ t("automation.scraper.stats.interviewEntryValue") }}</div>
        <div class="stat-desc">{{ t("automation.scraper.stats.interviewEntryDescription") }}</div>
      </div>
    </div>

    <div class="card card-border bg-base-100">
      <div class="card-body">
        <div class="flex items-center justify-between mb-3">
          <h2 class="card-title">{{ t("automation.scraper.table.title") }}</h2>
          <NuxtLink :to="APP_ROUTES.jobs" class="btn btn-ghost btn-sm">{{ t("automation.scraper.table.openBoardButton") }}</NuxtLink>
        </div>

        <LoadingSkeleton v-if="jobsLoading && topJobs.length === 0" :lines="4" />

        <div v-else-if="topJobs.length === 0" role="alert" class="alert alert-soft">
          <span>{{ t("automation.scraper.table.emptyState") }}</span>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table" :aria-label="t('automation.scraper.table.aria')">
            <thead>
              <tr>
                <th>{{ t("automation.scraper.table.columns.role") }}</th>
                <th>{{ t("automation.scraper.table.columns.company") }}</th>
                <th>{{ t("automation.scraper.table.columns.location") }}</th>
                <th>{{ t("automation.scraper.table.columns.posted") }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in topJobs" :key="job.id" class="hover:bg-base-200">
                <td>{{ job.title }}</td>
                <td>{{ job.company }}</td>
                <td>{{ job.location }}</td>
                <td>{{ relativePostedDate(job.postedDate) }}</td>
                <td class="text-right">
                  <button
                    class="btn btn-primary btn-sm"
                    :aria-label="t('automation.scraper.table.interviewAria', { title: job.title, company: job.company })"
                    @click="startJobInterview(job.id)"
                  >
                    {{ t("automation.scraper.table.interviewButton") }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
