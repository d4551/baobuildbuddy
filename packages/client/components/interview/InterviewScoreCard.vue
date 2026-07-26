<script setup lang="ts">
import type { InterviewAnalysis, InterviewResponse } from "@bao/shared/types/interview";
import { resolveInterviewAnalysisAttributions } from "@bao/shared/utils/interview-analysis-provenance";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import UiRadialMeter from "~/components/ui/UiRadialMeter.vue";
import {
  BADGE_SOFT_INFO_XS_CLASS,
  BADGE_SOFT_NEUTRAL_CLASS,
  BADGE_SOFT_PRIMARY_CLASS,
  BADGE_SOFT_WARNING_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  INSET_PANEL_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = defineProps<{
  analysis: InterviewAnalysis;
  responses: readonly InterviewResponse[];
}>();

const { t } = useI18n();

const roundedScore = computed(() => Math.round(props.analysis.overallScore));

const analysisSource = computed(() => props.analysis.analysisSource ?? "unknown");

/**
 * Badge tone tracks how trustworthy the attribution is: a real AI assessment
 * reads as primary, a heuristic fallback as a warning, a mix as info, and an
 * unrecorded source stays neutral so it is never mistaken for a model verdict.
 */
const provenanceBadgeClass = computed(() => {
  if (analysisSource.value === "ai") return BADGE_SOFT_PRIMARY_CLASS;
  if (analysisSource.value === "heuristic") return BADGE_SOFT_WARNING_CLASS;
  if (analysisSource.value === "mixed") return BADGE_SOFT_INFO_XS_CLASS;
  return BADGE_SOFT_NEUTRAL_CLASS;
});

const provenanceLabel = computed(() => {
  if (analysisSource.value === "ai") return t("interviewScoreCard.provenance.ai");
  if (analysisSource.value === "heuristic") return t("interviewScoreCard.provenance.heuristic");
  if (analysisSource.value === "mixed") return t("interviewScoreCard.provenance.mixed");
  return t("interviewScoreCard.provenance.unknown");
});

const attributions = computed(() => resolveInterviewAnalysisAttributions(props.responses));

const countsLabel = computed(() => {
  const counts = props.analysis.provenanceCounts;
  if (!counts) {
    return "";
  }
  return t("interviewScoreCard.provenance.counts", {
    ai: counts.ai,
    heuristic: counts.heuristic,
    unattributed: counts.unknown,
  });
});

const aiAverageLabel = computed(() => {
  const average = props.analysis.aiAverageScore;
  if (average === null || average === undefined) {
    return "";
  }
  return t("interviewScoreCard.provenance.aiAverage", { score: Math.round(average) });
});

const sections = computed(() => [
  { key: "strengths", title: t("interviewScoreCard.strengths"), items: props.analysis.strengths },
  {
    key: "improvements",
    title: t("interviewScoreCard.areasForImprovement"),
    items: props.analysis.improvements,
  },
  {
    key: "recommendations",
    title: t("interviewScoreCard.recommendations"),
    items: props.analysis.recommendations,
  },
]);
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS" aria-labelledby="interview-score-card-title">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h2
          id="interview-score-card-title"
          class="card-title"
          :class="[TYPOGRAPHY_SCALE_CLASS.lg]"
        >
          {{ t("interviewScoreCard.title") }}
        </h2>
        <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewScoreCard.description") }}
        </p>
      </div>

      <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
        <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
          <UiRadialMeter
            :value="roundedScore"
            :size-class="ICON_SIZE_CLASS[20]"
            fill-class="stroke-primary"
            :aria-label="t('interviewScoreCard.progressAria', { score: roundedScore })"
          >
            <span :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">
              {{ roundedScore }}
            </span>
          </UiRadialMeter>
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ t("interviewScoreCard.overallScore") }}
            </p>
            <p :class="[FONT_WEIGHT_TOKEN_CLASS.semibold, TYPOGRAPHY_SCALE_CLASS.xl2]">
              {{ roundedScore }}%
            </p>
          </div>
        </div>

        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ t("interviewScoreCard.provenance.label") }}
          </p>
          <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span :class="provenanceBadgeClass">{{ provenanceLabel }}</span>
            <span
              v-for="attribution in attributions"
              :key="`${attribution.provider}-${attribution.model}`"
              :class="BADGE_SOFT_INFO_XS_CLASS"
            >
              {{
                t("interviewScoreCard.provenance.modelAttribution", {
                  provider: attribution.provider,
                  model: attribution.model,
                })
              }}
            </span>
          </div>
          <p v-if="aiAverageLabel" class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ aiAverageLabel }}
          </p>
          <p v-if="countsLabel" class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ countsLabel }}
          </p>
        </div>
      </div>

      <SectionGrid grid-token="threeColumnLgGap4" tag="div">
        <div
          v-for="section in sections"
          :key="section.key"
          :class="[
            INSET_PANEL_CLASS,
            PADDING_TOKEN_CLASS.p4,
            STACK_SPACE_Y_TOKEN_CLASS.stack2,
          ]"
        >
          <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.semibold, TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ section.title }}
          </h3>
          <ul
            v-if="section.items.length > 0"
            class="list-inside list-disc"
            :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1, TYPOGRAPHY_SCALE_CLASS.sm]"
          >
            <li v-for="(item, index) in section.items" :key="`${section.key}-${index}`">
              {{ item }}
            </li>
          </ul>
          <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ t("interviewScoreCard.emptyList") }}
          </p>
        </div>
      </SectionGrid>
    </div>
  </section>
</template>
