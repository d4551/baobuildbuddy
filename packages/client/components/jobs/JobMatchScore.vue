<script setup lang="ts">
const props = defineProps<{
  score: number;
  breakdown?: {
    skills: number;
    experience: number;
    location: number;
  };
}>();

const scoreColor = computed(() => {
  if (props.score > 80) return "text-success";
  if (props.score > 60) return "text-warning";
  return "text-error";
});

const scoreBorderColor = computed(() => {
  if (props.score > 80) return "border-success";
  if (props.score > 60) return "border-warning";
  return "border-error";
});
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="radial-progress" :class="[scoreColor, scoreBorderColor]" :style="`--value:${score};`" role="progressbar">
      <span class="text-2xl font-bold">{{ score }}%</span>
    </div>

    <div v-if="breakdown" class="w-full space-y-3">
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>Skills Match</span>
          <span class="font-medium">{{ breakdown.skills }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.skills"
          max="100"
        ></progress>
      </div>

      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>Experience Match</span>
          <span class="font-medium">{{ breakdown.experience }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.experience"
          max="100"
        ></progress>
      </div>

      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>Location Match</span>
          <span class="font-medium">{{ breakdown.location }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.location"
          max="100"
        ></progress>
      </div>
    </div>
  </div>
</template>
