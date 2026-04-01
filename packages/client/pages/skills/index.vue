<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import SkillsPageFilters from "~/components/skills/SkillsPageFilters.vue";
import SkillsPageInsights from "~/components/skills/SkillsPageInsights.vue";
import SkillsPageMappings from "~/components/skills/SkillsPageMappings.vue";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { useSkillsPage } from "~/composables/useSkillsPage";
import {
  SKILLS_CONFIDENCE_MAX,
  SKILLS_CONFIDENCE_MIN,
  SKILLS_MIN_GAME_EXPRESSION_LENGTH,
  SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH,
} from "~/constants/skills";

definePageMeta({
  middleware: ["auth"],
});

const SKILLS_ADD_MAPPING_DIALOG_TITLE_ID = "skills-page-add-mapping-dialog-title";

const { t } = useI18n();
const {
  addApplication,
  analyzing,
  categoryFilter,
  categoryOptions,
  clearDeleteMappingState,
  clearFilters,
  gamificationLevel,
  gamificationXP,
  handleAddMapping,
  handleAIAnalyze,
  handleDeleteMapping,
  hasActiveFilters,
  hasMappings,
  filteredMappings,
  initializeSkillsPage,
  loading,
  mappingMetrics,
  newApplication,
  newMapping,
  pageError,
  requestDeleteMapping,
  removeApplication,
  searchFilter,
  showAddModal,
  showDeleteMappingDialog,
  topMappings,
} = useSkillsPage();

useSeoMeta({
  title: t("skillsPage.seoTitle"),
  description: t("skillsPage.seoDescription"),
});

const { pending: bootstrapPending, refresh: refreshSkillsPage } = await useAsyncData(
  "skills-page-bootstrap",
  async () => {
    await initializeSkillsPage();
    return true;
  },
);
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
          <IconBolt v-else class="h-4 w-4" />
          {{ t("skillsPage.actions.aiAnalyzeButton") }}
        </button>
        <button
          class="btn btn-primary"
          :aria-label="t('skillsPage.actions.addMappingAria')"
          @click="showAddModal = true"
        >
          <IconPlus class="h-4 w-4" />
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
      @retry="refreshSkillsPage"
    />

    <div v-else class="space-y-6">
      <SkillsPageInsights :mapping-metrics="mappingMetrics" :top-mappings="topMappings" />

      <SkillsPageFilters
        v-model:category-filter="categoryFilter"
        v-model:search-filter="searchFilter"
        :category-options="categoryOptions"
        :has-active-filters="hasActiveFilters"
        @clear="clearFilters"
      />

      <SkillsPageMappings
        :has-mappings="hasMappings"
        :filtered-mappings="filteredMappings"
        @delete="requestDeleteMapping"
      />
    </div>

    <AppModalFrame
      v-model:open="showAddModal"
      :title-id="SKILLS_ADD_MAPPING_DIALOG_TITLE_ID"
      size-token="compact"
      :close-aria-label="t('skillsPage.createModal.closeBackdropAria')"
      :close-backdrop-label="t('skillsPage.createModal.closeBackdropButton')"
    >
      <h3 :id="SKILLS_ADD_MAPPING_DIALOG_TITLE_ID" class="mb-4 text-lg font-bold">
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
              type="button"
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
                <CloseIcon class="h-3 w-3" />
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
          :disabled="loading || !newMapping.gameExpression.trim() || !newMapping.transferableSkill.trim()"
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
