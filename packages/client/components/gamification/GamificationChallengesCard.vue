<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { DailyChallenge } from "@bao/shared/types/gamification";
import { useI18n } from "vue-i18n";
import { GAMIFICATION_PROGRESS_MIN } from "~/constants/gamification";
import {
  BADGE_PRIMARY_CLASS,
  BADGE_SUCCESS_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  WIDTH_TOKEN_CLASS,
} from "~/constants/layout";

defineProps<{
  challenges: readonly DailyChallenge[];
  completingChallenge: string | null;
  getChallengeGoal: (challenge: DailyChallenge) => number;
  getChallengeProgress: (challenge: DailyChallenge) => number;
  canClaimChallenge: (challenge: DailyChallenge) => boolean;
}>();

const emit = defineEmits<{
  claim: [challengeId: string];
}>();

const { t } = useI18n();
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <h2 class="card-title" :class="[MARGIN_TOKEN_CLASS.mb4]">{{ t("gamificationPage.dailyChallengesTitle") }}</h2>

      <div v-if="challenges.length > 0" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <article 
          v-for="challenge in challenges"
          :key="challenge.id"
          :class="SURFACE_GLASS_CARD_CLASS"
        >
          <div class="card-body" :class="[PADDING_TOKEN_CLASS.p4]">
            <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb2]">
              <h3 class="font-semibold">{{ challenge.name }}</h3>
              <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                <span :class="BADGE_PRIMARY_CLASS">+{{ challenge.xpReward }} {{ t("gamificationPage.xpSuffix") }}</span>
                <span v-if="challenge.completed" :class="BADGE_SUCCESS_CLASS">
                  {{ t("gamificationPage.challengeDoneLabel") }}
                </span>
              </div>
            </div>

            <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
              <span :class="[TYPOGRAPHY_SCALE_CLASS.lg, WIDTH_TOKEN_CLASS.w8]" aria-hidden="true">{{ challenge.icon }}</span>
              <progress 
                class="progress flex-1"
                :class="challenge.completed ? 'progress-success' : 'progress-primary'"
                :value="getChallengeProgress(challenge)"
                :max="getChallengeGoal(challenge)"
                :aria-valuenow="getChallengeProgress(challenge)"
                :aria-valuemin="GAMIFICATION_PROGRESS_MIN"
                :aria-valuemax="getChallengeGoal(challenge)"
                :aria-label="t('gamificationPage.a11y.challengeProgress')"
              ></progress>
              <span class="font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ getChallengeProgress(challenge) }} / {{ getChallengeGoal(challenge) }}
              </span>
            </div>

            <div v-if="canClaimChallenge(challenge)" class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt2]">
              <button
                type="button"
                :class="[PRIMARY_ACTION_CLASS, 'btn-success']"
                :disabled="completingChallenge === challenge.id"
                :aria-label="t('gamificationPage.challengeClaimAria', { challenge: challenge.name })"
                @click="emit('claim', challenge.id)"
              >
                <LoadingSpinner
                  v-if="completingChallenge === challenge.id"
                  size="xs"
                  label="Loading"
                  aria-hidden="true"
                />
                {{ t("gamificationPage.challengeClaimLabel") }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <EmptyState
        v-else
        title-key="gamificationPage.noChallengesTitle"
        description-key="gamificationPage.noChallengesDescription"
        cta-label-key="gamificationPage.emptyStateCta"
        :cta-to="APP_ROUTES.dashboard"
      />
    </div>
  </section>
</template>
