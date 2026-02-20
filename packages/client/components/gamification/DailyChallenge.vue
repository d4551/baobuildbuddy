<script setup lang="ts">
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
</script>

<template>
  <div
    class="card bg-base-100 shadow-md relative overflow-hidden"
    :class="challenge.completed ? 'opacity-75' : 'hover:shadow-lg transition-shadow'"
  >
    <div v-if="challenge.completed" class="absolute inset-0 bg-success/10 flex items-center justify-center z-10">
      <div class="flex items-center gap-2 text-success font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-2xl">Completed!</span>
      </div>
    </div>

    <div class="card-body">
      <div class="flex justify-between items-start">
        <h2 class="card-title">{{ challenge.title }}</h2>
        <div class="badge badge-accent gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          {{ challenge.xpReward }} XP
        </div>
      </div>

      <p class="text-sm text-base-content/70">{{ challenge.description }}</p>

      <div class="card-actions justify-end mt-4">
        <button
          class="btn btn-primary"
          :disabled="challenge.completed"
          @click="emit('complete')"
        >
          <span v-if="challenge.completed">Completed</span>
          <span v-else>Complete Challenge</span>
        </button>
      </div>
    </div>
  </div>
</template>
