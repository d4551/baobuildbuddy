<script setup lang="ts">
import {
  APP_ROUTE_BUILDERS,
  APP_ROUTES,
  AUTOMATION_SCRAPE_TARGETS,
  type AutomationScrapeTarget,
  formatRelativeTimeForDate,
  JOB_PREVIEW_LIMIT,
  type Job,
  type RpaCapabilityAuditEntry,
  type RpaCapabilityAuditReport,
  type RpaRunExecutionEnvelope,
  SCRAPER_JOB_QUERY_LIMIT,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { useAutomation } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { formatDateWithLocale } from "~/utils/locale-format";

type RunState = "idle" | "running" | "success" | "error";
type ScrapePendingAction = `${AutomationScrapeTarget}-run` | `${AutomationScrapeTarget}-schedule`;
type TargetRecord<TValue> = Record<AutomationScrapeTarget, TValue>;
type ScrapeCapabilityCard = RpaCapabilityAuditEntry & {
  readonly category: "scrape";
  readonly target: AutomationScrapeTarget;
};

const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;
const RUN_STATE_BADGE_CLASS: Record<RunState, string> = {
  idle: "badge-ghost",
  running: "badge-info",
  success: "badge-success",
  error: "badge-error",
};

const { jobs, searchJobs, loading: jobsLoading } = useJobs();
const router = useRouter();
const { $toast } = useNuxtApp();
const { t, locale, fallbackLocale } = useI18n();
const { awardForAction } = usePipelineGamification();
const { getRpaCapabilities, scheduleScrape, triggerScrape } = useAutomation();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.scraper.title"),
    description: t("automation.scraper.subtitle"),
  });
}

const createTargetRecord = <TValue>(factory: () => TValue): TargetRecord<TValue> =>
  Object.fromEntries(
    AUTOMATION_SCRAPE_TARGETS.map((target) => [target, factory()]),
  ) as TargetRecord<TValue>;

const isScrapeCapabilityCard = (
  capability: RpaCapabilityAuditEntry,
): capability is ScrapeCapabilityCard =>
  capability.category === "scrape" && capability.target !== null;

const runStates = reactive(createTargetRecord<RunState>(() => "idle"));
const runMessages = reactive(createTargetRecord<string>(() => ""));
const lastRunAt = reactive(createTargetRecord<string | null>(() => null));
const scheduledRunAt = reactive(createTargetRecord<string>(() => ""));
const latestRuns = reactive(createTargetRecord<RpaRunExecutionEnvelope | null>(() => null));
const pendingAction = ref<ScrapePendingAction | null>(null);

const {
  data: capabilityAuditData,
  status: capabilityAuditStatus,
  error: capabilityAuditError,
  refresh: refreshCapabilityAudit,
} = await useAsyncData<RpaCapabilityAuditReport>(
  "automation-scraper-capabilities",
  () => getRpaCapabilities(),
  {
    lazy: false,
    server: true,
  },
);

const {
  status: scraperJobsStatus,
  error: scraperJobsError,
  refresh: refreshScraperJobs,
} = await useAsyncData("automation-scraper-jobs", async () => {
  await searchJobs({ limit: String(SCRAPER_JOB_QUERY_LIMIT) });
  return true;
});

const scraperJobsPending = computed(
  () => scraperJobsStatus.value === "pending" || scraperJobsStatus.value === "idle",
);

const sortedJobs = computed(() => {
  const rows = [...jobs.value];
  rows.sort((a, b) => {
    const aTime = new Date(a.postedDate).getTime();
    const bTime = new Date(b.postedDate).getTime();
    return bTime - aTime;
  });
  return rows;
});

const topJobs = computed(() => sortedJobs.value.slice(0, JOB_PREVIEW_LIMIT));
const jobCount = computed(() => sortedJobs.value.length);
const enrichedJobCount = computed(
  () => sortedJobs.value.filter((job) => typeof job.enrichment?.summary === "string").length,
);
const capabilityAudit = computed(() => capabilityAuditData.value ?? null);
const scrapeCapabilities = computed<readonly ScrapeCapabilityCard[]>(() =>
  (capabilityAudit.value?.capabilities ?? []).filter(isScrapeCapabilityCard),
);
const configuredCapabilityCount = computed(
  () => scrapeCapabilities.value.filter((capability) => capability.configured).length,
);
const availableManualRunCount = computed(
  () => scrapeCapabilities.value.filter((capability) => capability.manualRunAvailable).length,
);
const overallJobState = computed<RunState>(() => {
  const jobTargets = scrapeCapabilities.value.filter(
    (capability) => capability.target !== "studios",
  );
  if (jobTargets.some((capability) => runStates[capability.target] === "running")) {
    return "running";
  }
  if (jobTargets.some((capability) => runStates[capability.target] === "error")) {
    return "error";
  }
  if (jobTargets.some((capability) => runStates[capability.target] === "success")) {
    return "success";
  }
  return "idle";
});

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
  return formatRelativeTimeForDate(
    date,
    (key, params) => t(key, params as Record<string, unknown>),
    {
      keyPrefix: "automation.scraper",
      unknownKey: "automation.scraper.unknownPostedDate",
    },
  );
}

async function refreshJobsFeed() {
  await searchJobs({ limit: String(SCRAPER_JOB_QUERY_LIMIT) });
}

function runStateLabel(state: RunState): string {
  if (state === "running") return t("automation.scraper.state.running");
  if (state === "success") return t("automation.scraper.state.success");
  if (state === "error") return t("automation.scraper.state.error");
  return t("automation.scraper.state.idle");
}

function runStateBadgeClass(state: RunState): string {
  return RUN_STATE_BADGE_CLASS[state];
}

function capabilityAvailabilityLabel(capability: ScrapeCapabilityCard): string {
  if (capability.configured) {
    return t("automation.hub.audit.available");
  }
  if (capability.enabled) {
    return t("automation.hub.audit.needsConfig");
  }
  return t("automation.hub.audit.unavailable");
}

function capabilityAvailabilityBadgeClass(capability: ScrapeCapabilityCard): string {
  if (capability.configured) {
    return "badge-success";
  }
  if (capability.enabled) {
    return "badge-warning";
  }
  return "badge-error";
}

function latestRunNoticeText(target: AutomationScrapeTarget): string {
  const run = latestRuns[target];
  if (!run) {
    return "";
  }
  if (run.status === "pending") {
    return t("automation.scraper.schedule.scheduledForLabel", {
      date: toLocalizedDateTime(resolveScheduledRunAt(run)),
    });
  }
  return t("automation.scraper.lastRunLabel", {
    value: formatRunTime(lastRunAt[target]),
  });
}

function latestRunStatusText(target: AutomationScrapeTarget): string {
  const run = latestRuns[target];
  if (!run) {
    return "";
  }
  return t("automation.scraper.schedule.statusLabel", {
    status: run.status,
  });
}

function isPendingAction(target: AutomationScrapeTarget, action: "run" | "schedule"): boolean {
  return pendingAction.value === `${target}-${action}`;
}

async function scheduleScrapeRun(target: AutomationScrapeTarget): Promise<void> {
  const runAt = toIsoTimestamp(scheduledRunAt[target]);
  if (!runAt) {
    runStates[target] = "error";
    runMessages[target] = t("automation.scraper.schedule.invalidRunAt");
    return;
  }

  pendingAction.value = `${target}-schedule`;
  latestRuns[target] = null;
  const scheduleResult = await settlePromise(
    scheduleScrape({
      target,
      runAt,
    }),
    t("automation.scraper.errors.scheduleFailed"),
  );
  pendingAction.value = null;

  if (!scheduleResult.ok) {
    runStates[target] = "error";
    runMessages[target] = getErrorMessage(
      scheduleResult.error,
      t("automation.scraper.errors.scheduleFailed"),
    );
    return;
  }

  runStates[target] = "success";
  runMessages[target] = t("automation.scraper.schedule.createdMessage");
  latestRuns[target] = scheduleResult.value;
}

async function runScrapeTarget(target: AutomationScrapeTarget): Promise<void> {
  runStates[target] = "running";
  runMessages[target] = "";
  latestRuns[target] = null;
  pendingAction.value = `${target}-run`;

  const runResult = await settlePromise(
    triggerScrape({ target }),
    target === "studios"
      ? t("automation.scraper.errors.studioFailed")
      : t("automation.scraper.errors.jobFailed"),
  );
  pendingAction.value = null;

  if (!runResult.ok) {
    runStates[target] = "error";
    runMessages[target] = getErrorMessage(
      runResult.error,
      target === "studios"
        ? t("automation.scraper.errors.studioFailed")
        : t("automation.scraper.errors.jobFailed"),
    );
    return;
  }

  if (target !== "studios") {
    await refreshJobsFeed();
  }
  await refreshCapabilityAudit();

  runStates[target] = "success";
  lastRunAt[target] = runResult.value.completedAt ?? runResult.value.updatedAt;
  latestRuns[target] = runResult.value;

  const reward = await resolvePipelineReward(
    target === "studios" ? "scraperStudios" : "scraperJobs",
  );
  runMessages[target] = reward
    ? target === "studios"
      ? t("automation.scraper.messages.studioCompletedWithXp", { xp: reward })
      : t("automation.scraper.messages.jobCompletedWithXp", { xp: reward })
    : target === "studios"
      ? t("automation.scraper.messages.studioCompleted")
      : t("automation.scraper.messages.jobCompleted");
  if (reward) {
    $toast.success(
      target === "studios"
        ? t("automation.scraper.toasts.studioReward", { xp: reward })
        : t("automation.scraper.toasts.jobReward", { xp: reward }),
    );
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

function cardDescription(target: AutomationScrapeTarget): string {
  return target === "studios"
    ? t("automation.scraper.studioCard.description")
    : t("automation.scraper.jobCard.description");
}

function cardRunAria(target: AutomationScrapeTarget): string {
  return target === "studios"
    ? t("automation.scraper.studioCard.runAria")
    : t("automation.scraper.jobCard.runAria");
}

function cardRunButtonLabel(target: AutomationScrapeTarget): string {
  return target === "studios"
    ? t("automation.scraper.studioCard.runButton")
    : t("automation.scraper.jobCard.runButton");
}

function hasJobEnrichment(job: Job): boolean {
  return typeof job.enrichment?.summary === "string" && job.enrichment.summary.length > 0;
}

function jobInterviewFocusAreas(job: Job): string[] {
  return job.enrichment?.interviewFocusAreas.slice(0, 2) ?? [];
}
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-scraper-title">
    <PageHeroHeader
      title-id="automation-scraper-title"
      :title="t('automation.scraper.title')"
      :description="t('automation.scraper.subtitle')"
      description-class="text-base-content/70"
      density="compact"
    />

    <div
      role="alert"
      class="alert alert-info alert-soft alert-vertical gap-4 rounded-box border border-info/20 bg-base-100 sm:alert-horizontal"
    >
      <div class="space-y-1">
        <p class="font-display text-sm font-semibold uppercase tracking-[0.24em] text-info">
          {{ t("automation.hub.audit.title") }}
        </p>
        <p class="text-sm text-base-content/75">
          {{ t("automation.hub.audit.description") }}
        </p>
      </div>
      <NuxtLink :to="APP_ROUTES.automationRuns" class="btn btn-info btn-soft btn-sm">
        {{ t("automation.hub.viewRunsButton") }}
      </NuxtLink>
    </div>

    <ul
      class="steps steps-vertical w-full rounded-box border border-base-300 bg-base-100 p-4 shadow-sm lg:steps-horizontal"
      :aria-label="t('automation.scraper.stepsAria')"
    >
      <li class="step step-primary">{{ t("automation.scraper.steps.run") }}</li>
      <li class="step">{{ t("automation.scraper.steps.review") }}</li>
      <li class="step">{{ t("automation.scraper.steps.interview") }}</li>
    </ul>

    <LoadingSkeleton
      v-if="capabilityAuditStatus === 'pending' || capabilityAuditStatus === 'idle'"
      :lines="6"
    />

    <BootstrapErrorAlert
      v-else-if="capabilityAuditStatus === 'error'"
      :message="getErrorMessage(capabilityAuditError, t('automation.scraper.errors.capabilitiesLoadFailed'))"
      :retry-label="t('automation.scraper.errors.capabilitiesRetry')"
      :retry-aria-label="t('automation.scraper.errors.capabilitiesRetryAria')"
      @retry="() => refreshCapabilityAudit()"
    />

    <template v-else>
      <BootstrapErrorAlert
        v-if="scraperJobsStatus === 'error'"
        :message="getErrorMessage(scraperJobsError, t('automation.scraper.errors.jobsFeedLoadFailed'))"
        :retry-label="t('automation.scraper.errors.jobsFeedRetry')"
        :retry-aria-label="t('automation.scraper.errors.jobsFeedRetryAria')"
        @retry="() => refreshScraperJobs()"
      />

      <LoadingSkeleton v-if="scraperJobsPending" :lines="6" />

      <template v-else>
        <div
          class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm lg:stats-horizontal"
        >
          <div class="stat">
            <div class="stat-title">{{ t("automation.hub.audit.summary.total") }}</div>
            <div class="stat-value text-primary">{{ scrapeCapabilities.length }}</div>
            <div class="stat-desc">{{ t("automation.hub.audit.summary.totalDesc") }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">{{ t("automation.hub.audit.summary.configured") }}</div>
            <div class="stat-value text-secondary">{{ configuredCapabilityCount }}</div>
            <div class="stat-desc">{{ t("automation.hub.audit.summary.configuredDesc") }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">{{ t("automation.scraper.stats.availableJobsTitle") }}</div>
            <div class="stat-value text-primary">{{ jobCount }}</div>
            <div class="stat-desc">{{ t("automation.scraper.stats.availableJobsDescription") }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">{{ t("automation.scraper.stats.enrichedJobsTitle") }}</div>
            <div class="stat-value text-secondary">{{ enrichedJobCount }}</div>
            <div class="stat-desc">{{ t("automation.scraper.stats.enrichedJobsDescription") }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">{{ t("automation.scraper.stats.jobStatusTitle") }}</div>
            <div class="stat-value text-lg">{{ runStateLabel(overallJobState) }}</div>
            <div class="stat-desc">
              {{
                t("automation.hub.audit.columns.manual")
              }}:
              {{ availableManualRunCount }}
            </div>
          </div>
        </div>

        <SectionGrid grid-token="twoColumnXl">
          <div
            v-for="capability in scrapeCapabilities"
            :key="capability.id"
            class="card card-border rounded-box border border-base-300 bg-base-100 shadow-sm"
          >
            <div class="card-body gap-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="card-title">{{ capability.name }}</h2>
                    <span class="badge badge-soft badge-sm" :class="capabilityAvailabilityBadgeClass(capability)">
                      {{ capabilityAvailabilityLabel(capability) }}
                    </span>
                    <span class="badge badge-sm" :class="runStateBadgeClass(runStates[capability.target])">
                      {{ runStateLabel(runStates[capability.target]) }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="badge badge-outline badge-sm">
                      {{ t("automation.hub.audit.columns.manual") }}
                    </span>
                    <span class="badge badge-outline badge-sm">
                      {{ t("automation.hub.audit.columns.scheduled") }}
                    </span>
                    <span class="badge badge-outline badge-sm">
                      {{ t("automation.hub.audit.columns.history") }}
                    </span>
                    <span class="badge badge-outline badge-sm">
                      {{ t("automation.hub.audit.columns.live") }}
                    </span>
                  </div>
                </div>
                <NuxtLink :to="APP_ROUTES.automationRuns" class="btn btn-ghost btn-sm">
                  {{ t("automation.hub.viewRunsButton") }}
                </NuxtLink>
              </div>

              <p class="text-sm text-base-content/70">
                {{ cardDescription(capability.target) }}
              </p>
              <p class="text-xs text-base-content/60">
                {{ t("automation.scraper.lastRunLabel", { value: formatRunTime(lastRunAt[capability.target]) }) }}
              </p>

              <div v-if="capability.issues.length > 0" role="alert" class="alert alert-warning alert-soft">
                <div class="space-y-1">
                  <p class="font-medium">{{ capabilityAvailabilityLabel(capability) }}</p>
                  <ul class="space-y-1 text-sm">
                    <li v-for="issue in capability.issues" :key="issue">
                      {{ issue }}
                    </li>
                  </ul>
                </div>
              </div>

              <fieldset class="fieldset rounded-box border border-base-300 bg-base-200/50 p-4">
                <legend class="fieldset-legend">{{ t("automation.scraper.schedule.legend") }}</legend>
                <input
                  v-model="scheduledRunAt[capability.target]"
                  class="input w-full"
                  type="datetime-local"
                  :aria-label="t('automation.scraper.schedule.aria')"
                />
                <p class="label">{{ t("automation.scraper.schedule.hint") }}</p>
              </fieldset>

              <div class="card-actions justify-end gap-3">
                <button
                  class="btn btn-primary"
                  :aria-label="cardRunAria(capability.target)"
                  :disabled="pendingAction !== null || !capability.configured"
                  @click="runScrapeTarget(capability.target)"
                >
                  <span v-if="isPendingAction(capability.target, 'run')" class="loading loading-spinner loading-xs"></span>
                  <span>{{ cardRunButtonLabel(capability.target) }}</span>
                </button>
                <button
                  class="btn btn-outline"
                  :aria-label="t('automation.scraper.schedule.buttonAria')"
                  :disabled="pendingAction !== null || !capability.configured || !scheduledRunAt[capability.target]"
                  @click="scheduleScrapeRun(capability.target)"
                >
                  <span v-if="isPendingAction(capability.target, 'schedule')" class="loading loading-spinner loading-xs"></span>
                  <span>{{ t("automation.scraper.schedule.button") }}</span>
                </button>
              </div>

              <div v-if="runStates[capability.target] !== 'idle'" class="mt-2">
                <div
                  v-if="runStates[capability.target] === 'success'"
                  role="alert"
                  class="alert alert-success alert-vertical sm:alert-horizontal"
                >
                  <span>{{ runMessages[capability.target] }}</span>
                </div>
                <div
                  v-else-if="runStates[capability.target] === 'error'"
                  role="alert"
                  class="alert alert-error alert-vertical sm:alert-horizontal"
                >
                  <span>{{ runMessages[capability.target] }}</span>
                </div>
              </div>

              <div
                v-if="latestRuns[capability.target]"
                role="alert"
                class="alert alert-info alert-vertical gap-3 sm:alert-horizontal"
              >
                <div class="space-y-1">
                  <p class="font-medium">
                    {{ latestRunNoticeText(capability.target) }}
                  </p>
                  <p class="text-sm">
                    {{ latestRunStatusText(capability.target) }}
                  </p>
                </div>
                <NuxtLink
                  :to="APP_ROUTE_BUILDERS.automationRunDetail(latestRuns[capability.target]?.id ?? '')"
                  class="btn btn-ghost btn-sm"
                  :aria-label="t('automation.scraper.openRunDetailAria', { id: latestRuns[capability.target]?.id ?? '' })"
                >
                  {{ t("automation.scraper.openRunDetailButton") }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </SectionGrid>

        <div class="card card-border bg-base-100">
          <div class="card-body gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="card-title">{{ t("automation.scraper.table.title") }}</h2>
              <div class="flex flex-wrap gap-2">
                <span class="badge badge-soft badge-primary">
                  {{ t("automation.scraper.stats.interviewEntryTitle") }}:
                  {{ t("automation.scraper.stats.interviewEntryValue") }}
                </span>
                <NuxtLink :to="APP_ROUTES.jobs" class="btn btn-ghost btn-sm">
                  {{ t("automation.scraper.table.openBoardButton") }}
                </NuxtLink>
              </div>
            </div>

            <LoadingSkeleton v-if="jobsLoading && topJobs.length === 0" :lines="4" />

            <div v-else-if="topJobs.length === 0" role="alert" class="alert alert-soft">
              <span>{{ t("automation.scraper.table.emptyState") }}</span>
            </div>

            <div v-else class="overflow-x-auto rounded-box border border-base-300">
              <table class="table table-zebra" :aria-label="t('automation.scraper.table.aria')">
                <thead>
                  <tr>
                    <th scope="col">{{ t("automation.scraper.table.columns.role") }}</th>
                    <th scope="col">{{ t("automation.scraper.table.columns.company") }}</th>
                    <th scope="col">{{ t("automation.scraper.table.columns.location") }}</th>
                    <th scope="col">{{ t("automation.scraper.table.columns.posted") }}</th>
                    <th scope="col">
                      <span class="sr-only">{{ t("automation.scraper.table.actionsLabel") }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="job in topJobs" :key="job.id" class="hover:bg-base-200">
                    <td>
                      <div class="space-y-1">
                        <div class="font-medium">{{ job.title }}</div>
                        <p v-if="hasJobEnrichment(job)" class="text-sm text-base-content/70">
                          <span class="font-medium">{{ t("automation.scraper.table.personaSummaryLabel") }}</span>
                          {{ job.enrichment?.summary }}
                        </p>
                        <div class="flex flex-wrap gap-2">
                          <span v-if="job.remote" class="badge badge-ghost badge-sm">
                            {{ t("jobCard.remoteBadge") }}
                          </span>
                          <span v-if="job.hybrid" class="badge badge-ghost badge-sm">
                            {{ t("jobCard.hybridBadge") }}
                          </span>
                          <span
                            v-for="focusArea in jobInterviewFocusAreas(job)"
                            :key="`${job.id}-${focusArea}`"
                            class="badge badge-warning badge-soft badge-sm"
                          >
                            {{ focusArea }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="space-y-1">
                        <div class="font-medium">{{ job.company }}</div>
                        <div v-if="job.source" class="text-xs text-base-content/60">
                          {{ job.source }}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-wrap items-center gap-2">
                        <span>{{ job.location }}</span>
                      </div>
                    </td>
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
      </template>
    </template>
  </PageScaffold>
</template>
