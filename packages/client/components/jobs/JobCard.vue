<script setup lang="ts">
const props = defineProps<{
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    remote?: boolean;
    hybrid?: boolean;
    postedDate: string;
    technologies: string[];
    matchScore?: number;
  };
}>();

const emit = defineEmits<{
  save: [];
  unsave: [];
}>();

const isSaved = ref(false);

const visibleTechs = computed(() => props.job.technologies.slice(0, 5));
const remainingCount = computed(() => Math.max(0, props.job.technologies.length - 5));

const matchScoreColor = computed(() => {
  if (!props.job.matchScore) return "badge-ghost";
  if (props.job.matchScore > 80) return "badge-success";
  if (props.job.matchScore > 60) return "badge-warning";
  return "badge-error";
});

const relativeTime = computed(() => {
  const now = new Date();
  const posted = new Date(props.job.postedDate);
  const diffTime = Math.abs(now.getTime() - posted.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
});

function toggleSave() {
  isSaved.value = !isSaved.value;
  emit(isSaved.value ? "save" : "unsave");
}

function navigateToJob() {
  navigateTo(`/jobs/${props.job.id}`);
}
</script>

<template>
  <div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
    <div
      class="card-body"
      role="button"
      tabindex="0"
      @click="navigateToJob"
      @keydown.enter="navigateToJob"
      @keydown.space.prevent="navigateToJob"
    >
      <div class="flex justify-between items-start">
        <h2 class="card-title text-lg">{{ job.title }}</h2>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          @click.stop="toggleSave"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            :fill="isSaved ? 'currentColor' : 'none'"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-base-content/70 font-medium">{{ job.company }}</p>

        <div class="flex flex-wrap gap-2 items-center">
          <div class="badge badge-ghost">{{ job.location }}</div>
          <div v-if="job.remote" class="badge badge-primary">Remote</div>
          <div v-if="job.hybrid" class="badge badge-secondary">Hybrid</div>
          <div v-if="job.matchScore" class="badge" :class="matchScoreColor">
            {{ job.matchScore }}% Match
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="tech in visibleTechs"
            :key="tech"
            class="badge badge-outline badge-sm"
          >
            {{ tech }}
          </div>
          <div v-if="remainingCount > 0" class="badge badge-outline badge-sm">
            +{{ remainingCount }} more
          </div>
        </div>

        <div class="text-xs text-base-content/50 mt-2">
          {{ relativeTime }}
        </div>
      </div>
    </div>
  </div>
</template>
