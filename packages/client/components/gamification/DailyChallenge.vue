<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  challenge: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
  };
}>();

const emit = defineEmits<{
  complete: [];
}>();
const { t } = useI18n();
</script>

<template>
  <div
    class="card bg-base-100 shadow-md relative overflow-hidden"
    :class="challenge.completed ? 'opacity-75' : 'hover:shadow-lg transition-shadow'"
  >
    <div
      v-if="challenge.completed"
      class="absolute inset-0 bg-success/10 flex items-center justify-center z-10"
      role="status"
      :aria-label="t('dailyChallengeCard.completedBanner')"
    >
      <div class="flex items-center gap-2 text-success font-bold">
        <IconCheckCircle class="h-12 w-12" />
        <span class="text-2xl">{{ t("dailyChallengeCard.completedBanner") }}</span>
      </div>
    </div>

    <div class="card-body">
      <div class="flex justify-between items-start">
        <h2 class="card-title">{{ challenge.title }}</h2>
        <div class="badge badge-accent gap-1">
          <IconSparkles class="h-3 w-3" />
          {{ t("dashboard.dailyChallengeXpLabel", { xp: challenge.xpReward }) }}
        </div>
      </div>

      <p class="text-sm text-base-content/70">{{ challenge.description }}</p>

      <div class="card-actions justify-end mt-4">
        <button
          class="btn btn-primary"
          :disabled="challenge.completed"
          :aria-label="t('dailyChallengeCard.completeAria', { title: challenge.title })"
          @click="emit('complete')"
        >
          <span v-if="challenge.completed">{{ t("dailyChallengeCard.completedButton") }}</span>
          <span v-else>{{ t("dailyChallengeCard.completeButton") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
