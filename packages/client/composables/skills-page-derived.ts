import { SKILL_CATEGORY_IDS, type SkillCategory, type SkillMapping } from "@bao/shared";
import type { Ref } from "vue";
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

export function createSkillsPageDerived({
  mappings,
  categoryFilter,
  searchFilter,
  level,
  xp,
  t,
}: SkillsPageDerivedInput) {
  const categoryOptions = computed(() =>
    SKILL_CATEGORY_IDS.map((value) => ({
      value,
      label: t(SKILLS_CATEGORY_LABEL_KEYS[value]),
    })),
  );

  const filteredMappings = computed(() => {
    const normalizedSearch = searchFilter.value.trim().toLowerCase();
    return mappings.value.filter((mapping) => {
      const categoryMatches =
        categoryFilter.value === SKILLS_FILTER_ALL_VALUE || mapping.category === categoryFilter.value;
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

  const hasActiveFilters = computed(
    () => categoryFilter.value !== SKILLS_FILTER_ALL_VALUE || searchFilter.value.trim().length > 0,
  );

  const mappingMetrics = computed(() => {
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

  const topMappings = computed(() =>
    [...filteredMappings.value]
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, SKILLS_TOP_MAPPINGS_PREVIEW_LIMIT),
  );

  const gamificationLevel = computed(() => level.value);
  const gamificationXP = computed(() => xp.value);
  const hasMappings = computed(() => mappings.value.length > 0);

  function clearFilters(): void {
    categoryFilter.value = SKILLS_FILTER_ALL_VALUE;
    searchFilter.value = "";
  }

  return {
    categoryOptions,
    clearFilters,
    filteredMappings,
    gamificationLevel,
    gamificationXP,
    hasActiveFilters,
    hasMappings,
    mappingMetrics,
    topMappings,
  };
}
