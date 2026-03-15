<script setup lang="ts">
import {
  APP_ROUTE_BUILDERS,
  API_ENDPOINTS,
  APP_ROUTES,
  formatRelativeTimeForDate,
  JOB_PREVIEW_LIMIT,
  SCRAPER_JOB_QUERY_LIMIT,
  type AutomationScrapeTarget,
  type Job,
  type RpaRunExecutionEnvelope,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { useAutomation } from "~/composables/useAutomation";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { getErrorMessage } from "~/utils/errors";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { formatDateWithLocale } from "~/utils/locale-format";

type RunState = "idle" | "running" | "success" | "error";
type ScrapePendingAction =
  | "studios-run"
  | "studios-schedule"
  | "jobs_hitmarker-run"
  | "jobs_hitmarker-schedule";

const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

const requestUrl = useRequestURL();
const apiBase = String(useRuntimeConfig().public.apiBase || "/");

const studiosFetch = useFetch(
  resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.scraperStudios),
  {
    method: "POST",
    immediate: false,
  },
);

const jobsFetch = useFetch(
  resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.scraperJobsHitmarker),
  {
    method: "POST",
    immediate: false,
  },
);

const { jobs, searchJobs, loading: jobsLoading } = useJobs();
const router = useRouter();
const { $toast } = useNuxtApp();
const { t, locale, fallbackLocale } = useI18n();
const { awardForAction } = usePipelineGamification();
const { scheduleScrape } = useAutomation();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.scraper.title"),
    description: t("automation.scraper.subtitle"),
  });
}

const studioState = ref<RunState>("idle");
const jobState = ref<RunState>("idle");
const studioMessage = ref("");
const jobMessage = ref("");
const studioLastRunAt = ref<string | null>(null);
const jobLastRunAt = ref<string | null>(null);
const studioRunAt = ref("");
const jobRunAt = ref("");
const studioScheduledRun = ref<RpaRunExecutionEnvelope | null>(null);
const jobScheduledRun = ref<RpaRunExecutionEnvelope | null>(null);
const pendingAction = ref<ScrapePendingAction | null>(null);

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
  const formattedDate = formatDateWithLocale(
    value,
    locale.value,
    fallbackLocale.value,
    DATE_FORMAT_OPTIONS,
  );
  return formattedDate ?? t("automation.scraper.notRunYet");
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function toLocalizedDateTime(value: string): string {
  const formattedDate = formatDateWithLocale(
    value,
    locale.value,
    fallbackLocale.value,
    DATE_FORMAT_OPTIONS,
  );
  return formattedDate ?? value;
}

function resolveScheduledRunAt(run: RpaRunExecutionEnvelope): string {
  const runInput = run.input;
  if (!runInput || !isRecord(runInput)) {
    return run.createdAt;
  }
  const scheduleValue = runInput.schedule;
  if (!isRecord(scheduleValue)) {
    return run.createdAt;
  }
  return typeof scheduleValue.runAt === "string" && scheduleValue.runAt.length > 0
    ? scheduleValue.runAt
    : run.createdAt;
}

function toIsoTimestamp(dateTimeLocal: string): string | null {
  const parsed = new Date(dateTimeLocal);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
    return null;
  }
  return parsed.toISOString();
}

function relativePostedDate(date: string): string {
  return formatRelativeTimeForDate(date, (key, params) => t(key, params), {
    keyPrefix: "automation.scraper",
    unknownKey: "automation.scraper.unknownPostedDate",
  });
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
  studioScheduledRun.value = null;
  pendingAction.value = "studios-run";

  await studiosFetch.refresh();
  pendingAction.value = null;

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
  jobScheduledRun.value = null;
  pendingAction.value = "jobs_hitmarker-run";

  await jobsFetch.refresh();
  pendingAction.value = null;

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

async function scheduleScrapeRun(target: AutomationScrapeTarget): Promise<void> {
  const runAtValue = target === "studios" ? studioRunAt.value : jobRunAt.value;
  const runAt = toIsoTimestamp(runAtValue);
  if (!runAt) {
    if (target === "studios") {
      studioState.value = "error";
      studioMessage.value = t("automation.scraper.schedule.invalidRunAt");
    } else {
      jobState.value = "error";
      jobMessage.value = t("automation.scraper.schedule.invalidRunAt");
    }
    return;
  }

  pendingAction.value = target === "studios" ? "studios-schedule" : "jobs_hitmarker-schedule";
  if (target === "studios") {
    studioScheduledRun.value = null;
  } else {
    jobScheduledRun.value = null;
  }
  const scheduleResult = await settlePromise(
    scheduleScrape({
      target,
      runAt,
    }),
    t("automation.scraper.errors.scheduleFailed"),
  );
  pendingAction.value = null;

  if (!scheduleResult.ok) {
    const errorMessage = getErrorMessage(
      scheduleResult.error,
      t("automation.scraper.errors.scheduleFailed"),
    );
    if (target === "studios") {
      studioState.value = "error";
      studioMessage.value = errorMessage;
    } else {
      jobState.value = "error";
      jobMessage.value = errorMessage;
    }
    return;
  }

  if (target === "studios") {
    studioState.value = "success";
    studioMessage.value = t("automation.scraper.schedule.createdMessage");
    studioScheduledRun.value = scheduleResult.value;
  } else {
    jobState.value = "success";
    jobMessage.value = t("automation.scraper.schedule.createdMessage");
    jobScheduledRun.value = scheduleResult.value;
  }
}

async function startJobInterview(jobId: string) {
  await router.push(buildInterviewJobNavigation(jobId, "scraper"));
}

async function resolvePipelineReward(
  action: "scraperStudios" | "scraperJobs",
): Promise<number | null> {
  const rewardResult = await settlePromise(
    awardForAction(action),
    t("automation.scraper.errors.rewardFailed"),
  );
  if (!rewardResult.ok) {
    // Scraper completion feedback must remain stable without gamification.
    return null;
  }
  return rewardResult.value.awarded ? rewardResult.value.amount : null;
}
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-scraper-title">
    <PageHeaderBlock
      title-id="automation-scraper-title"
      :title="t('automation.scraper.title')"
      :description="t('automation.scraper.subtitle')"
    />

    <ul class="steps steps-vertical lg:steps-horizontal w-full" :aria-label="t('automation.scraper.stepsAria')">
      <li class="step step-primary">{{ t("automation.scraper.steps.run") }}</li>
      <li class="step">{{ t("automation.scraper.steps.review") }}</li>
      <li class="step">{{ t("automation.scraper.steps.interview") }}</li>
    </ul>

    <SectionGrid grid-token="twoColumnXl">
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

          <fieldset class="fieldset mt-4">
            <legend class="fieldset-legend">{{ t("automation.scraper.schedule.legend") }}</legend>
            <input
              v-model="studioRunAt"
              class="input input-bordered w-full"
              type="datetime-local"
              :aria-label="t('automation.scraper.schedule.aria')"
            />
            <p class="validator-hint">{{ t("automation.scraper.schedule.hint") }}</p>
          </fieldset>

          <div class="card-actions justify-end gap-3">
            <button
              class="btn btn-primary"
              :aria-label="t('automation.scraper.studioCard.runAria')"
              :disabled="pendingAction !== null"
              @click="runStudios"
            >
              <span
                v-if="pendingAction === 'studios-run'"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>{{ t("automation.scraper.studioCard.runButton") }}</span>
            </button>
            <button
              class="btn btn-outline"
              :aria-label="t('automation.scraper.schedule.buttonAria')"
              :disabled="pendingAction !== null || !studioRunAt"
              @click="scheduleScrapeRun('studios')"
            >
              <span
                v-if="pendingAction === 'studios-schedule'"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>{{ t("automation.scraper.schedule.button") }}</span>
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

          <div v-if="studioScheduledRun" role="alert" class="alert alert-info mt-4">
            <div>
              <h3 class="font-semibold">{{ t("automation.scraper.schedule.createdTitle") }}</h3>
              <p class="text-sm">
                {{
                  t("automation.scraper.schedule.scheduledForLabel", {
                    date: toLocalizedDateTime(resolveScheduledRunAt(studioScheduledRun)),
                  })
                }}
              </p>
              <p class="text-sm">
                {{
                  t("automation.scraper.schedule.statusLabel", {
                    status: studioScheduledRun.status,
                  })
                }}
              </p>
            </div>
            <NuxtLink
              :to="APP_ROUTE_BUILDERS.automationRunDetail(studioScheduledRun.id)"
              class="btn btn-ghost btn-sm"
              :aria-label="t('automation.scraper.openRunDetailAria', { id: studioScheduledRun.id })"
            >
              {{ t("automation.scraper.openRunDetailButton") }}
            </NuxtLink>
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

          <fieldset class="fieldset mt-4">
            <legend class="fieldset-legend">{{ t("automation.scraper.schedule.legend") }}</legend>
            <input
              v-model="jobRunAt"
              class="input input-bordered w-full"
              type="datetime-local"
              :aria-label="t('automation.scraper.schedule.aria')"
            />
            <p class="validator-hint">{{ t("automation.scraper.schedule.hint") }}</p>
          </fieldset>

          <div class="card-actions justify-end gap-3">
            <button
              class="btn btn-primary"
              :aria-label="t('automation.scraper.jobCard.runAria')"
              :disabled="pendingAction !== null"
              @click="runJobs"
            >
              <span
                v-if="pendingAction === 'jobs_hitmarker-run'"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>{{ t("automation.scraper.jobCard.runButton") }}</span>
            </button>
            <button
              class="btn btn-outline"
              :aria-label="t('automation.scraper.schedule.buttonAria')"
              :disabled="pendingAction !== null || !jobRunAt"
              @click="scheduleScrapeRun('jobs_hitmarker')"
            >
              <span
                v-if="pendingAction === 'jobs_hitmarker-schedule'"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>{{ t("automation.scraper.schedule.button") }}</span>
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

          <div v-if="jobScheduledRun" role="alert" class="alert alert-info mt-4">
            <div>
              <h3 class="font-semibold">{{ t("automation.scraper.schedule.createdTitle") }}</h3>
              <p class="text-sm">
                {{
                  t("automation.scraper.schedule.scheduledForLabel", {
                    date: toLocalizedDateTime(resolveScheduledRunAt(jobScheduledRun)),
                  })
                }}
              </p>
              <p class="text-sm">
                {{
                  t("automation.scraper.schedule.statusLabel", {
                    status: jobScheduledRun.status,
                  })
                }}
              </p>
            </div>
            <NuxtLink
              :to="APP_ROUTE_BUILDERS.automationRunDetail(jobScheduledRun.id)"
              class="btn btn-ghost btn-sm"
              :aria-label="t('automation.scraper.openRunDetailAria', { id: jobScheduledRun.id })"
            >
              {{ t("automation.scraper.openRunDetailButton") }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </SectionGrid>

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
  </PageScaffold>
</template>
