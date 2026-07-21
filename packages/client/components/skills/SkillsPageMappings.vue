<script setup lang="ts">
import type { SkillMapping } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_ERROR_DENSE_CLASS,
  INSET_PANEL_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  WIDTH_TOKEN_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_SM_CLASS,
  BADGE_OUTLINE_SM_CLASS,
  BADGE_PRIMARY_SM_CLASS,
  BADGE_SOFT_SM_CLASS,
} from "~/constants/layout-badges";
import {
  SKILLS_CATEGORY_LABEL_KEYS,
  SKILLS_CONFIDENCE_MAX,
  SKILLS_CONFIDENCE_MIN,
} from "~/constants/skills";

defineProps<{
  hasMappings: boolean;
  filteredMappings: SkillMapping[];
}>();

const emit = defineEmits<{
  delete: [id: string];
  add: [];
  clearFilters: [];
}>();

const { t } = useI18n();

function resolveCategoryLabel(category: SkillMapping["category"]): string {
  return t(SKILLS_CATEGORY_LABEL_KEYS[category]);
}

function normalizedConfidence(confidence: number): number {
  return Math.min(SKILLS_CONFIDENCE_MAX, Math.max(SKILLS_CONFIDENCE_MIN, confidence));
}
</script>

<template>
  <EmptyState
    v-if="!hasMappings"
    title-key="skillsPage.emptyStateTitle"
    description-key="skillsPage.emptyStateDescription"
    cta-label-key="skillsPage.actions.addMappingButton"
    cta-aria-key="skillsPage.actions.addMappingAria"
    @cta="emit('add')"
  />

  <EmptyState
    v-else-if="filteredMappings.length === 0"
    title-key="skillsPage.filteredEmptyTitle"
    description-key="skillsPage.filteredEmptyDescription"
    cta-label-key="skillsPage.filters.clearButton"
    cta-aria-key="skillsPage.filters.clearAria"
    @cta="emit('clearFilters')"
  />

  <ResponsiveDataSurface v-else>
    <template #cards>
      <ul
        class="list-none"
        :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]"
        :aria-label="t('skillsPage.table.ariaLabel')"
      >
        <li
          v-for="mapping in filteredMappings"
          :key="mapping.id"
          :class="[INSET_PANEL_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p3]"
          :aria-label="t('skillsPage.mobile.cardAria', { skill: mapping.transferableSkill })"
        >
          <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <div>
              <p class="font-semibold">{{ mapping.transferableSkill }}</p>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ mapping.gameExpression }}</p>
            </div>
            <span :class="[BADGE_PRIMARY_SM_CLASS]">{{ mapping.confidence }}%</span>
          </div>

          <progress
            class="progress progress-primary"
            :class="[FLUID_WIDTH_CLASS]"
            :value="normalizedConfidence(mapping.confidence)"
            :max="SKILLS_CONFIDENCE_MAX"
            :aria-label="t('skillsPage.table.confidenceAria', { confidence: mapping.confidence })"
          ></progress>

          <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap1]">
            <span :class="[BADGE_OUTLINE_SM_CLASS]">{{ resolveCategoryLabel(mapping.category) }}</span>
            <span
              v-for="application in mapping.industryApplications.slice(0, 3)"
              :key="application"
              :class="[BADGE_SOFT_SM_CLASS]"
            >
              {{ application }}
            </span>
            <span v-if="mapping.industryApplications.length > 3" :class="[BADGE_GHOST_SM_CLASS]">
              {{ t("skillsPage.table.moreApplications", { count: mapping.industryApplications.length - 3 }) }}
            </span>
          </div>

          <button
            type="button"
            :class="[GHOST_ACTION_ERROR_DENSE_CLASS, FLUID_WIDTH_CLASS]"
            :aria-label="t('skillsPage.table.deleteAria', { skill: mapping.transferableSkill })"
            @click="emit('delete', mapping.id)"
          >
            {{ t("skillsPage.table.deleteButton") }}
          </button>
        </li>
      </ul>
    </template>
    <template #table>
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
              <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap1]">
                <span
                  v-for="application in mapping.industryApplications.slice(0, 3)"
                  :key="application"
                  :class="[BADGE_SOFT_SM_CLASS]"
                >
                  {{ application }}
                </span>
                <span v-if="mapping.industryApplications.length > 3" :class="[BADGE_GHOST_SM_CLASS]">
                  {{ t("skillsPage.table.moreApplications", { count: mapping.industryApplications.length - 3 }) }}
                </span>
              </div>
            </td>
            <td :class="[WIDTH_TOKEN_CLASS.w40]">
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <div class="flex items-center justify-between font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  <span>{{ mapping.confidence }}%</span>
                  <span class="text-muted">
                    {{ resolveCategoryLabel(mapping.category) }}
                  </span>
                </div>
                <progress
                  class="progress progress-primary"
                  :class="[FLUID_WIDTH_CLASS]"
                  :value="normalizedConfidence(mapping.confidence)"
                  :max="SKILLS_CONFIDENCE_MAX"
                  :aria-label="t('skillsPage.table.confidenceAria', { confidence: mapping.confidence })"
                ></progress>
              </div>
            </td>
            <td>
              <span :class="[BADGE_OUTLINE_SM_CLASS]">
                {{ resolveCategoryLabel(mapping.category) }}
              </span>
            </td>
            <td>
              <button
                type="button"
                :class="[GHOST_ACTION_ERROR_DENSE_CLASS]"
                :aria-label="t('skillsPage.table.deleteAria', { skill: mapping.transferableSkill })"
                @click="emit('delete', mapping.id)"
              >
                {{ t("skillsPage.table.deleteButton") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </ResponsiveDataSurface>
</template>
