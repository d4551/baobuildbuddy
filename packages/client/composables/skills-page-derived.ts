import { SKILL_CATEGORY_IDS, type SkillCategory, type SkillMapping } from "@bao/shared";
import type { ComputedRef, Ref } from "vue";
import {
  SKILLS_CATEGORY_LABEL_KEYS,
  SKILLS_FILTER_ALL_VALUE,
  SKILLS_TOP_MAPPINGS_PREVIEW_LIMIT,
} from "~/constants/skills";

type SkillsFilterValue = typeof SKILLS_FILTER_ALL_VALUE | SkillCategory;

type SkillsPageDerivedInput = {
  mappings: Ref<SkillMapping[]>;
  categoryFilter: Ref<SkillsFilterValue>;
  searchFilter: Ref<string>;
  level: Ref<number>;
  xp: Ref<number>;
  t: (key: string) => string;
};

function createSkillCategoryOptions(t: SkillsPageDerivedInput["t"]) {
  return computed(() =>
    SKILL_CATEGORY_IDS.map((value) => ({
      value,
      label: t(SKILLS_CATEGORY_LABEL_KEYS[value]),
    })),
  );
}

function createFilteredMappings({
  mappings,
  categoryFilter,
  searchFilter,
}: Pick<SkillsPageDerivedInput, "mappings" | "categoryFilter" | "searchFilter">) {
  return computed(() => {
    const normalizedSearch = searchFilter.value.trim().toLowerCase();
    return mappings.value.filter((mapping) => {
      const categoryMatches =
        categoryFilter.value === SKILLS_FILTER_ALL_VALUE ||
        mapping.category === categoryFilter.value;
      if (!categoryMatches) {
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
}

function createMappingMetrics(mappings: SkillsPageDerivedInput["mappings"]) {
  return computed(() => {
    const total = mappings.value.length;
    const confidenceTotal = mappings.value.reduce((accumulator, mapping) => {
      const confidenceValue = Number.isFinite(mapping.confidence) ? mapping.confidence : 0;
      return accumulator + confidenceValue;
    }, 0);

    return {
      total,
      averageConfidence: total > 0 ? Math.round(confidenceTotal / total) : 0,
      aiGeneratedCount: mappings.value.filter((mapping) => mapping.aiGenerated).length,
      categoriesUsed: new Set(mappings.value.map((mapping) => mapping.category)).size,
    };
  });
}

function createTopMappings(filteredMappings: ComputedRef<SkillMapping[]>) {
  return computed(() =>
    [...filteredMappings.value]
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, SKILLS_TOP_MAPPINGS_PREVIEW_LIMIT),
  );
}

function createGamificationSummary({
  mappings,
  categoryFilter,
  searchFilter,
  level,
  xp,
}: SkillsPageDerivedInput) {
  return {
    gamificationLevel: computed(() => level.value),
    gamificationXP: computed(() => xp.value),
    hasMappings: computed(() => mappings.value.length > 0),
    hasActiveFilters: computed(
      () =>
        categoryFilter.value !== SKILLS_FILTER_ALL_VALUE || searchFilter.value.trim().length > 0,
    ),
  };
}

export function createSkillsPageDerived(input: SkillsPageDerivedInput) {
  const categoryOptions = createSkillCategoryOptions(input.t);
  const filteredMappings = createFilteredMappings(input);
  const mappingMetrics = createMappingMetrics(input.mappings);
  const topMappings = createTopMappings(filteredMappings);
  const summary = createGamificationSummary(input);

  function clearFilters(): void {
    input.categoryFilter.value = SKILLS_FILTER_ALL_VALUE;
    input.searchFilter.value = "";
  }

  return {
    categoryOptions,
    clearFilters,
    filteredMappings,
    mappingMetrics,
    topMappings,
    ...summary,
  };
}
