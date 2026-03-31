<script setup lang="ts">
import type { DailyChallenge } from "@bao/shared";
import { GAMIFICATION_PROGRESS_MIN } from "~/constants/gamification";

defineProps<{
  challenges: readonly DailyChallenge[];
  completingChallenge: string | null;
  t: (key: string, values?: Record<string, unknown>) => string;
  getChallengeGoal: (challenge: DailyChallenge) => number;
  getChallengeProgress: (challenge: DailyChallenge) => number;
  canClaimChallenge: (challenge: DailyChallenge) => boolean;
}>();

const emit = defineEmits<{
  claim: [challengeId: string];
}>();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title mb-4">{{ t("gamificationPage.dailyChallengesTitle") }}</h2>

      <div v-if="challenges.length > 0" class="space-y-3">
        <article
          v-for="challenge in challenges"
          :key="challenge.id"
          class="card card-border bg-base-100"
        >
          <div class="card-body p-4">
            <div class="mb-2 flex items-center justify-between">
              <h3 class="font-semibold">{{ challenge.name }}</h3>
              <div class="flex items-center gap-2">
                <span class="badge badge-primary">+{{ challenge.xpReward }} {{ t("gamificationPage.xpSuffix") }}</span>
                <span v-if="challenge.completed" class="badge badge-success">
                  {{ t("gamificationPage.challengeDoneLabel") }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="w-8 text-lg" aria-hidden="true">{{ challenge.icon }}</span>
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
              <span class="text-sm font-medium">
                {{ getChallengeProgress(challenge) }} / {{ getChallengeGoal(challenge) }}
              </span>
            </div>

            <div v-if="canClaimChallenge(challenge)" class="card-actions mt-2 justify-end">
              <button
                type="button"
                class="btn btn-success btn-sm"
                :disabled="completingChallenge === challenge.id"
                :aria-label="t('gamificationPage.challengeClaimAria', { challenge: challenge.name })"
                @click="emit('claim', challenge.id)"
              >
                <span
                  v-if="completingChallenge === challenge.id"
                  class="loading loading-spinner loading-xs"
                  aria-hidden="true"
                ></span>
                {{ t("gamificationPage.challengeClaimLabel") }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <p v-else class="text-sm text-base-content/60">{{ t("gamificationPage.noChallengesLabel") }}</p>
    </div>
  </section>
</template>
