<script setup lang="ts">
import {
  APP_ROUTES,
  ROUTE_GAMIFICATION_XP,
  SKILL_CATEGORY_IDS,
  type SkillCategory,
  type SkillMapping,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { toSkillMapping } from "~/composables/api-normalizers";
import { settlePromise } from "~/composables/async-flow";
import {
  SKILLS_CATEGORY_LABEL_KEYS,
  SKILLS_CONFIDENCE_MAX,
  SKILLS_CONFIDENCE_MIN,
  SKILLS_DEFAULT_CATEGORY,
  SKILLS_DEFAULT_CONFIDENCE,
  SKILLS_DEFAULT_DEMAND_LEVEL,
  SKILLS_FILTER_ALL_VALUE,
  SKILLS_GAMIFICATION_REASONS,
  SKILLS_GAMIFICATION_XP,
  SKILLS_MIN_GAME_EXPRESSION_LENGTH,
  SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH,
  SKILLS_TOP_MAPPINGS_PREVIEW_LIMIT,
  type SkillsGamificationReason,
} from "~/constants/skills";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

type SkillsFilterValue = typeof SKILLS_FILTER_ALL_VALUE | SkillCategory;

interface NewSkillMappingFormState {
  gameExpression: string;
  transferableSkill: string;
  industryApplications: string[];
  confidence: number;
  category: SkillCategory;
}

const api = useApi();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const { awardXP, progress, fetchProgress } = useGamification();

const mappings = ref<SkillMapping[]>([]);
const loading = ref(false);
const analyzing = ref(false);
const pageError = ref<string | null>(null);
const showAddModal = ref(false);
const SKILLS_ADD_MAPPING_DIALOG_TITLE_ID = "skills-page-add-mapping-dialog-title";
const showDeleteMappingDialog = ref(false);
const pendingDeleteMappingId = ref<string | null>(null);

const categoryFilter = ref<SkillsFilterValue>(SKILLS_FILTER_ALL_VALUE);
const searchFilter = ref("");
const newApplication = ref("");

const newMapping = reactive<NewSkillMappingFormState>({
  gameExpression: "",
  transferableSkill: "",
  industryApplications: [],
  confidence: SKILLS_DEFAULT_CONFIDENCE,
  category: SKILLS_DEFAULT_CATEGORY,
});

if (import.meta.server) {
  useServerSeoMeta({
    title: t("skillsPage.seoTitle"),
    description: t("skillsPage.seoDescription"),
  });
}

const categoryOptions = computed(() =>
  SKILL_CATEGORY_IDS.map((value) => ({
    value,
    label: t(SKILLS_CATEGORY_LABEL_KEYS[value]),
  })),
);

const filteredMappings = computed(() => {
  const normalizedSearch = searchFilter.value.trim().toLowerCase();
  return mappings.value.filter((mapping) => {
    const categoryMatch =
      categoryFilter.value === SKILLS_FILTER_ALL_VALUE || mapping.category === categoryFilter.value;
    if (!categoryMatch) {
      return false;
    }

    if (normalizedSearch.length === 0) {
      return true;
    }

    const searchableContent = [
      mapping.gameExpression,
      mapping.transferableSkill,
      ...mapping.industryApplications,
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(normalizedSearch);
  });
});

const hasActiveFilters = computed(
  () => categoryFilter.value !== SKILLS_FILTER_ALL_VALUE || searchFilter.value.trim().length > 0,
);

const mappingMetrics = computed(() => {
  const total = mappings.value.length;
  const confidenceTotal = mappings.value.reduce((accumulator, mapping) => {
    const confidenceValue = Number.isFinite(mapping.confidence) ? mapping.confidence : 0;
    return accumulator + confidenceValue;
  }, 0);
  const averageConfidence = total > 0 ? Math.round(confidenceTotal / total) : 0;
  const aiGeneratedCount = mappings.value.filter((mapping) => mapping.aiGenerated).length;
  const categoriesUsed = new Set(mappings.value.map((mapping) => mapping.category)).size;

  return {
    total,
    averageConfidence,
    aiGeneratedCount,
    categoriesUsed,
  };
});

const topMappings = computed(() =>
  [...filteredMappings.value]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, SKILLS_TOP_MAPPINGS_PREVIEW_LIMIT),
);

const gamificationLevel = computed(() => progress.value?.level ?? 1);
const gamificationXP = computed(() => progress.value?.xp ?? 0);
const hasMappings = computed(() => mappings.value.length > 0);

const { pending: bootstrapPending, refresh: refreshSkillsPage } = await useAsyncData(
  "skills-page-bootstrap",
  async () => {
    await initializeSkillsPage();
    return true;
  },
);

function resolveCategoryLabel(category: SkillCategory): string {
  return t(SKILLS_CATEGORY_LABEL_KEYS[category]);
}

function clearFilters(): void {
  categoryFilter.value = SKILLS_FILTER_ALL_VALUE;
  searchFilter.value = "";
}

function normalizedConfidence(confidence: number): number {
  return Math.min(SKILLS_CONFIDENCE_MAX, Math.max(SKILLS_CONFIDENCE_MIN, confidence));
}

function resetForm(): void {
  newMapping.gameExpression = "";
  newMapping.transferableSkill = "";
  newMapping.industryApplications = [];
  newMapping.confidence = SKILLS_DEFAULT_CONFIDENCE;
  newMapping.category = SKILLS_DEFAULT_CATEGORY;
  newApplication.value = "";
}

async function fetchMappings(): Promise<void> {
  pageError.value = null;
  loading.value = true;
  const mappingsResult = await settlePromise(
    api.skills.mappings.get(),
    t("skillsPage.errors.fetchFailed"),
  );
  loading.value = false;

  if (!mappingsResult.ok) {
    pageError.value = getErrorMessage(mappingsResult.error, t("skillsPage.errors.fetchFailed"));
    $toast.error(pageError.value);
    return;
  }

  const { data } = mappingsResult.value;
  mappings.value = Array.isArray(data)
    ? data
        .map((entry) => toSkillMapping(entry))
        .filter((entry): entry is SkillMapping => entry !== null)
    : [];
}

async function initializeSkillsPage(): Promise<void> {
  await Promise.all([fetchMappings(), syncGamificationProgress()]);
}

async function syncGamificationProgress(): Promise<void> {
  await settlePromise(fetchProgress(), t("skillsPage.errors.gamificationLoadFailed"));
}

async function tryAwardSkillXp(amount: number, reason: SkillsGamificationReason): Promise<boolean> {
  const awardResult = await settlePromise(
    awardXP(amount, reason),
    t("apiErrors.gamification.awardXPFailed"),
  );
  return awardResult.ok;
}

async function handleAddMapping(): Promise<void> {
  const normalizedGameExpression = newMapping.gameExpression.trim();
  if (normalizedGameExpression.length < SKILLS_MIN_GAME_EXPRESSION_LENGTH) {
    $toast.error(t("skillsPage.errors.gameExpressionMinLength"));
    return;
  }

  const normalizedTransferableSkill = newMapping.transferableSkill.trim();
  if (normalizedTransferableSkill.length < SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH) {
    $toast.error(t("skillsPage.errors.transferableSkillMinLength"));
    return;
  }

  loading.value = true;
  const addMappingResult = await settlePromise(
    (async () => {
      await api.skills.mappings.post({
        gameExpression: normalizedGameExpression,
        transferableSkill: normalizedTransferableSkill,
        industryApplications: newMapping.industryApplications,
        confidence: newMapping.confidence,
        category: newMapping.category,
        demandLevel: SKILLS_DEFAULT_DEMAND_LEVEL,
      });
      await fetchMappings();
      showAddModal.value = false;
      resetForm();
      return true;
    })(),
    t("skillsPage.errors.addFailed"),
  );
  loading.value = false;

  if (!addMappingResult.ok) {
    $toast.error(getErrorMessage(addMappingResult.error, t("skillsPage.errors.addFailed")));
    return;
  }

  $toast.success(
    t("skillsPage.toasts.mappingAddedWithXp", {
      xp: ROUTE_GAMIFICATION_XP.skillsMapped,
    }),
  );
}

function requestDeleteMapping(id: string): void {
  pendingDeleteMappingId.value = id;
  showDeleteMappingDialog.value = true;
}

function clearDeleteMappingState(): void {
  pendingDeleteMappingId.value = null;
}

async function handleDeleteMapping(): Promise<void> {
  const id = pendingDeleteMappingId.value;
  if (!id) return;

  loading.value = true;
  const deleteResult = await settlePromise(
    (async () => {
      await api.skills.mappings({ id }).delete();
      await fetchMappings();
    })(),
    t("skillsPage.errors.deleteFailed"),
  );
  loading.value = false;
  clearDeleteMappingState();
  showDeleteMappingDialog.value = false;

  if (!deleteResult.ok) {
    $toast.error(getErrorMessage(deleteResult.error, t("skillsPage.errors.deleteFailed")));
    return;
  }

  $toast.success(t("skillsPage.toasts.mappingDeleted"));
}

async function handleAIAnalyze(): Promise<void> {
  analyzing.value = true;
  const analysisResult = await settlePromise(
    api.skills["ai-analyze"].post({}),
    t("skillsPage.errors.analysisFailed"),
  );
  analyzing.value = false;

  if (!analysisResult.ok) {
    $toast.error(getErrorMessage(analysisResult.error, t("skillsPage.errors.analysisFailed")));
    return;
  }

  if (analysisResult.value.data) {
    await fetchMappings();
    const awardedXp = await tryAwardSkillXp(
      SKILLS_GAMIFICATION_XP.aiAnalysisCompleted,
      SKILLS_GAMIFICATION_REASONS.aiAnalysisCompleted,
    );
    $toast.success(
      awardedXp
        ? t("skillsPage.toasts.analysisCompletedWithXp", {
            xp: SKILLS_GAMIFICATION_XP.aiAnalysisCompleted,
          })
        : t("skillsPage.toasts.analysisCompleted"),
    );
  }
}

function addApplication(): void {
  const normalizedApplication = newApplication.value.trim();
  if (!normalizedApplication) {
    return;
  }
  newMapping.industryApplications.push(normalizedApplication);
  newApplication.value = "";
}

function removeApplication(index: number): void {
  newMapping.industryApplications.splice(index, 1);
}
</script>

<template>
  <PageScaffold
    tag="section"
    width-token="content"
    spacing-token="comfortable"
    labelled-by="skills-page-title"
  >
    <PageHeroHeader
      title-id="skills-page-title"
      :title="t('skillsPage.title')"
      :description="t('skillsPage.subtitle')"
    >
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.gamification"
          class="btn btn-ghost gap-2"
          :aria-label="t('skillsPage.gamification.openProgressAria')"
        >
          <span class="badge badge-primary badge-sm">
            {{ t("skillsPage.gamification.levelLabel", { level: gamificationLevel }) }}
          </span>
          <span class="text-xs">{{ t("skillsPage.gamification.xpLabel", { xp: gamificationXP }) }}</span>
        </NuxtLink>
        <button
          class="btn btn-outline"
          :disabled="analyzing"
          :aria-label="t('skillsPage.actions.aiAnalyzeAria')"
          @click="handleAIAnalyze"
        >
          <span v-if="analyzing" class="loading loading-spinner loading-xs"></span>
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ t("skillsPage.actions.aiAnalyzeButton") }}
        </button>
        <button
          class="btn btn-primary"
          :aria-label="t('skillsPage.actions.addMappingAria')"
          @click="showAddModal = true"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ t("skillsPage.actions.addMappingButton") }}
        </button>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="bootstrapPending && !hasMappings" variant="cards" :lines="6" />

    <BootstrapErrorAlert
      v-else-if="pageError && !hasMappings"
      :title="t('skillsPage.title')"
      :message="pageError"
      :retry-label="t('skillsPage.retryButton')"
      :retry-aria-label="t('skillsPage.retryAria')"
      @retry="() => refreshSkillsPage()"
    />

    <div v-else class="space-y-6">
      <div class="stats stats-vertical w-full bg-base-200 lg:stats-horizontal">
        <div class="stat">
          <div class="stat-title">{{ t("skillsPage.stats.totalMappingsTitle") }}</div>
          <div class="stat-value text-primary">{{ mappingMetrics.total }}</div>
          <div class="stat-desc">{{ t("skillsPage.stats.totalMappingsDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("skillsPage.stats.averageConfidenceTitle") }}</div>
          <div class="stat-value text-success">{{ mappingMetrics.averageConfidence }}%</div>
          <div class="stat-desc">{{ t("skillsPage.stats.averageConfidenceDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("skillsPage.stats.aiGeneratedTitle") }}</div>
          <div class="stat-value text-info">{{ mappingMetrics.aiGeneratedCount }}</div>
          <div class="stat-desc">{{ t("skillsPage.stats.aiGeneratedDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("skillsPage.stats.categoriesUsedTitle") }}</div>
          <div class="stat-value text-warning">{{ mappingMetrics.categoriesUsed }}</div>
          <div class="stat-desc">{{ t("skillsPage.stats.categoriesUsedDesc") }}</div>
        </div>
      </div>

      <div class="card card-border bg-base-100 shadow-sm">
        <div class="card-body">
          <p class="text-sm text-base-content/70">
            {{ t("skillsPage.description") }}
          </p>
        </div>
      </div>

      <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article class="card card-border bg-base-100 shadow-sm">
          <div class="card-body gap-4">
            <div class="space-y-1">
              <h2 class="card-title text-lg">{{ t("skillsPage.insights.pathwaysTitle") }}</h2>
              <p class="text-sm text-base-content/70">
                {{ t("skillsPage.insights.pathwaysDescription") }}
              </p>
            </div>

            <ul class="list rounded-box bg-base-200/60">
              <li class="list-row">
                <span class="font-medium">{{ t("skillsPage.insights.totalMappingsLabel") }}</span>
                <span class="list-col-grow"></span>
                <span class="badge badge-neutral">{{ mappingMetrics.total }}</span>
              </li>
              <li class="list-row">
                <span class="font-medium">{{ t("skillsPage.insights.avgConfidenceLabel") }}</span>
                <span class="list-col-grow"></span>
                <span class="badge badge-primary">{{ mappingMetrics.averageConfidence }}%</span>
              </li>
              <li class="list-row">
                <span class="font-medium">{{ t("skillsPage.insights.categoriesCoverageLabel") }}</span>
                <span class="list-col-grow"></span>
                <span class="badge badge-secondary">{{ mappingMetrics.categoriesUsed }}</span>
              </li>
            </ul>

            <div class="card-actions justify-end">
              <NuxtLink
                :to="APP_ROUTES.skillsPathways"
                class="btn btn-primary btn-sm"
                :aria-label="t('skillsPage.insights.pathwaysButtonAria')"
              >
                {{ t("skillsPage.insights.pathwaysButton") }}
              </NuxtLink>
            </div>
          </div>
        </article>

        <article class="card card-border bg-base-100 shadow-sm">
          <div class="card-body gap-4">
            <div class="space-y-1">
              <h2 class="card-title text-lg">{{ t("skillsPage.insights.topMappingsTitle") }}</h2>
              <p class="text-sm text-base-content/70">
                {{ t("skillsPage.insights.topMappingsDescription") }}
              </p>
            </div>

            <ul
              v-if="topMappings.length > 0"
              class="list rounded-box bg-base-200/60"
              :aria-label="t('skillsPage.insights.topMappingsAria')"
            >
              <li
                v-for="mapping in topMappings"
                :key="mapping.id"
                class="list-row items-center"
              >
                <div class="list-col-grow">
                  <p class="font-medium">{{ mapping.transferableSkill }}</p>
                  <p class="text-xs text-base-content/70">{{ mapping.gameExpression }}</p>
                </div>
                <span class="badge badge-primary badge-sm">{{ mapping.confidence }}%</span>
              </li>
            </ul>

            <EmptyState
              v-else
              title-key="skillsPage.insights.topMappingsEmptyTitle"
              description-key="skillsPage.insights.topMappingsEmptyDescription"
            />
          </div>
        </article>
      </section>

      <div class="card card-border bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <label class="input input-sm flex w-full items-center gap-2">
            <svg class="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchFilter"
              class="grow"
              type="text"
              :placeholder="t('skillsPage.filters.searchPlaceholder')"
              :aria-label="t('skillsPage.filters.searchAria')"
            />
          </label>

          <form class="filter gap-2 overflow-x-auto pb-1" :aria-label="t('skillsPage.filters.categoryGroupAria')">
            <input
              v-model="categoryFilter"
              type="radio"
              name="skills-category"
              class="btn btn-sm btn-ghost"
              :value="SKILLS_FILTER_ALL_VALUE"
              :aria-label="t('skillsPage.filters.allAria')"
            />
            <input
              v-for="categoryOption in categoryOptions"
              :key="categoryOption.value"
              v-model="categoryFilter"
              type="radio"
              name="skills-category"
              class="btn btn-sm btn-ghost"
              :value="categoryOption.value"
              :aria-label="t('skillsPage.filters.categoryAria', { category: categoryOption.label })"
            />
          </form>

          <div class="flex justify-end">
            <button
              class="btn btn-ghost btn-sm"
              :disabled="!hasActiveFilters"
              :aria-label="t('skillsPage.filters.clearAria')"
              @click="clearFilters"
            >
              {{ t("skillsPage.filters.clearButton") }}
            </button>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!hasMappings"
        title-key="skillsPage.emptyStateTitle"
        description-key="skillsPage.emptyStateDescription"
      />

      <EmptyState
        v-else-if="filteredMappings.length === 0"
        title-key="skillsPage.filteredEmptyTitle"
        description-key="skillsPage.filteredEmptyDescription"
      />

      <div v-else class="space-y-4">
        <div class="hidden overflow-x-auto md:block">
          <table class="table table-zebra" :aria-label="t('skillsPage.table.ariaLabel')">
            <thead>
              <tr>
                <th scope="col">{{ t("skillsPage.table.columns.gamingExperience") }}</th>
                <th scope="col">{{ t("skillsPage.table.columns.transferableSkill") }}</th>
                <th scope="col">{{ t("skillsPage.table.columns.applications") }}</th>
                <th scope="col">{{ t("skillsPage.table.columns.confidence") }}</th>
                <th scope="col">{{ t("skillsPage.table.columns.category") }}</th>
                <th scope="col">{{ t("skillsPage.table.columns.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mapping in filteredMappings" :key="mapping.id">
                <td class="font-medium">{{ mapping.gameExpression }}</td>
                <td>{{ mapping.transferableSkill }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="application in mapping.industryApplications.slice(0, 3)"
                      :key="application"
                      class="badge badge-sm badge-soft"
                    >
                      {{ application }}
                    </span>
                    <span v-if="mapping.industryApplications.length > 3" class="badge badge-sm badge-ghost">
                      {{ t("skillsPage.table.moreApplications", { count: mapping.industryApplications.length - 3 }) }}
                    </span>
                  </div>
                </td>
                <td class="w-40">
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs font-semibold">
                      <span>{{ mapping.confidence }}%</span>
                      <span class="text-base-content/60">
                        {{ resolveCategoryLabel(mapping.category) }}
                      </span>
                    </div>
                    <progress
                      class="progress progress-primary w-full"
                      :value="normalizedConfidence(mapping.confidence)"
                      :max="SKILLS_CONFIDENCE_MAX"
                      :aria-label="t('skillsPage.table.confidenceAria', { confidence: mapping.confidence })"
                    ></progress>
                  </div>
                </td>
                <td>
                  <span class="badge badge-outline badge-sm">
                    {{ resolveCategoryLabel(mapping.category) }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-ghost btn-sm btn-error"
                    :aria-label="t('skillsPage.table.deleteAria', { skill: mapping.transferableSkill })"
                    @click="requestDeleteMapping(mapping.id)"
                  >
                    {{ t("skillsPage.table.deleteButton") }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-3 md:hidden">
          <article
            v-for="mapping in filteredMappings"
            :key="mapping.id"
            class="card card-border bg-base-100 shadow-sm"
            :aria-label="t('skillsPage.mobile.cardAria', { skill: mapping.transferableSkill })"
          >
            <div class="card-body gap-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="card-title text-base">{{ mapping.transferableSkill }}</h2>
                  <p class="text-sm text-base-content/70">{{ mapping.gameExpression }}</p>
                </div>
                <span class="badge badge-primary badge-sm">{{ mapping.confidence }}%</span>
              </div>

              <progress
                class="progress progress-primary w-full"
                :value="normalizedConfidence(mapping.confidence)"
                :max="SKILLS_CONFIDENCE_MAX"
                :aria-label="t('skillsPage.table.confidenceAria', { confidence: mapping.confidence })"
              ></progress>

              <div class="flex flex-wrap gap-1">
                <span class="badge badge-outline badge-sm">{{ resolveCategoryLabel(mapping.category) }}</span>
                <span
                  v-for="application in mapping.industryApplications.slice(0, 3)"
                  :key="application"
                  class="badge badge-sm badge-soft"
                >
                  {{ application }}
                </span>
              </div>

              <div class="card-actions justify-end">
                <button
                  class="btn btn-ghost btn-sm btn-error"
                  :aria-label="t('skillsPage.table.deleteAria', { skill: mapping.transferableSkill })"
                  @click="requestDeleteMapping(mapping.id)"
                >
                  {{ t("skillsPage.table.deleteButton") }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <AppModalFrame
      v-model:open="showAddModal"
      :title-id="SKILLS_ADD_MAPPING_DIALOG_TITLE_ID"
      size-token="compact"
      :close-aria-label="t('skillsPage.createModal.closeBackdropAria')"
      :close-backdrop-label="t('skillsPage.createModal.closeBackdropButton')"
    >
      <h3 :id="SKILLS_ADD_MAPPING_DIALOG_TITLE_ID" class="font-bold text-lg mb-4">
        {{ t("skillsPage.createModal.title") }}
      </h3>

      <div class="space-y-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("skillsPage.createModal.gameExpressionLegend") }}</legend>
          <input
            v-model="newMapping.gameExpression"
            type="text"
            required
            :minlength="SKILLS_MIN_GAME_EXPRESSION_LENGTH"
            :placeholder="t('skillsPage.createModal.gameExpressionPlaceholder')"
            class="input validator w-full"
            :aria-label="t('skillsPage.createModal.gameExpressionAria')"
          />
          <p class="validator-hint">{{ t("skillsPage.createModal.gameExpressionHint") }}</p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("skillsPage.createModal.transferableSkillLegend") }}</legend>
          <input
            v-model="newMapping.transferableSkill"
            type="text"
            required
            :minlength="SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH"
            :placeholder="t('skillsPage.createModal.transferableSkillPlaceholder')"
            class="input validator w-full"
            :aria-label="t('skillsPage.createModal.transferableSkillAria')"
          />
          <p class="validator-hint">{{ t("skillsPage.createModal.transferableSkillHint") }}</p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("skillsPage.createModal.categoryLegend") }}</legend>
          <select
            v-model="newMapping.category"
            class="select validator w-full"
            :aria-label="t('skillsPage.createModal.categoryAria')"
          >
            <option v-for="categoryOption in categoryOptions" :key="categoryOption.value" :value="categoryOption.value">
              {{ categoryOption.label }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("skillsPage.createModal.applicationsLegend") }}</legend>
          <div class="join w-full">
            <input
              v-model="newApplication"
              type="text"
              class="input input-sm join-item w-full"
              :placeholder="t('skillsPage.createModal.applicationPlaceholder')"
              :aria-label="t('skillsPage.createModal.applicationAria')"
              @keyup.enter="addApplication"
            />
            <button
              class="btn btn-sm btn-primary join-item"
              :aria-label="t('skillsPage.createModal.addApplicationAria')"
              @click="addApplication"
            >
              {{ t("skillsPage.createModal.addApplicationButton") }}
            </button>
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="(application, index) in newMapping.industryApplications"
              :key="`${application}-${index}`"
              class="badge gap-2"
            >
              {{ application }}
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                :aria-label="t('skillsPage.createModal.removeApplicationAria', { application })"
                @click="removeApplication(index)"
              >
                <CloseIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("skillsPage.createModal.confidenceLegend", { confidence: newMapping.confidence }) }}
          </legend>
          <input
            v-model.number="newMapping.confidence"
            type="range"
            :min="SKILLS_CONFIDENCE_MIN"
            :max="SKILLS_CONFIDENCE_MAX"
            class="range range-primary"
            :aria-label="t('skillsPage.createModal.confidenceAria')"
          />
        </fieldset>
      </div>

      <div class="modal-action">
        <button
          class="btn btn-ghost"
          :aria-label="t('skillsPage.createModal.cancelAria')"
          @click="showAddModal = false"
        >
          {{ t("skillsPage.createModal.cancelButton") }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="!newMapping.gameExpression.trim() || !newMapping.transferableSkill.trim()"
          :aria-label="t('skillsPage.createModal.createAria')"
          @click="handleAddMapping"
        >
          {{ t("skillsPage.createModal.createButton") }}
        </button>
      </div>
    </AppModalFrame>

    <ConfirmDialog
      id="skills-delete-mapping-dialog"
      v-model:open="showDeleteMappingDialog"
      :title="t('skillsPage.deleteDialog.title')"
      :message="t('skillsPage.deleteDialog.message')"
      :confirm-text="t('skillsPage.deleteDialog.confirmButton')"
      :cancel-text="t('skillsPage.deleteDialog.cancelButton')"
      variant="danger"
      focus-primary
      @confirm="handleDeleteMapping"
      @cancel="clearDeleteMappingState"
    />
  </PageScaffold>
</template>
