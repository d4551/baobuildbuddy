<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared";
import type { Job } from "@bao/shared";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { getJob, saveJob, unsaveJob, applyToJob, savedJobs, loading } = useJobs();
const { $toast } = useNuxtApp();

const job = ref<Job | null>(null);
const showApplyModal = ref(false);
const applicationNotes = ref("");
const applying = ref(false);
const applyDialogRef = ref<HTMLDialogElement | null>(null);
useFocusTrap(applyDialogRef, () => showApplyModal.value);

const jobId = computed(() => route.params.id as string);
const breadcrumbs = computed(() => [
  { label: "Dashboard", to: APP_ROUTES.dashboard },
  { label: "Jobs", to: APP_ROUTES.jobs },
  { label: job.value?.title || "Job Detail" },
]);

const isSaved = computed(() => {
  return savedJobs.value.some((j) => j.id === jobId.value);
});

onMounted(async () => {
  job.value = await getJob(jobId.value);
});

watch(showApplyModal, (isOpen) => {
  const dialog = applyDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

async function handleSaveToggle() {
  try {
    if (isSaved.value) {
      await unsaveJob(jobId.value);
      $toast.success("Job unsaved");
    } else {
      await saveJob(jobId.value);
      $toast.success("Job saved");
    }
  } catch (error) {
    $toast.error(getErrorMessage(error, "Failed to save job"));
  }
}

async function handleApply() {
  applying.value = true;
  try {
    await applyToJob(jobId.value, applicationNotes.value);
    showApplyModal.value = false;
    applicationNotes.value = "";
    $toast.success("Application submitted");
  } catch (error) {
    $toast.error(getErrorMessage(error, "Failed to submit application"));
  } finally {
    applying.value = false;
  }
}

function getMatchScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function startJobInterview() {
  if (!job.value) return;
  router.push(buildInterviewJobNavigation(job.value.id, "jobs"));
}
</script>

<template>
  <div>
    <AppBreadcrumbs :crumbs="breadcrumbs" class="mb-6" />

    <LoadingSkeleton v-if="loading" :lines="10" />

    <div v-else-if="job" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Job Header -->
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h1 class="text-3xl font-bold mb-2">{{ job.title }}</h1>
                <p class="text-xl text-base-content/70 mb-4">{{ job.company }}</p>

                <div class="flex flex-wrap gap-2">
                  <span class="badge">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ job.location }}
                  </span>

                  <span v-if="job.remote" class="badge badge-success">
                    Remote
                  </span>

                  <span v-if="job.experienceLevel" class="badge badge-outline">
                    {{ job.experienceLevel }}
                  </span>

                  <span v-if="job.salary" class="badge badge-primary">
                    {{ job.salary }}
                  </span>
                </div>
              </div>

              <div v-if="job.matchScore" class="text-center">
                <div class="radial-progress" :class="getMatchScoreColor(job.matchScore)" :style="`--value:${job.matchScore}; --size:5rem;`">
                  <span class="text-lg font-bold">{{ job.matchScore }}%</span>
                </div>
                <p class="text-xs text-base-content/60 mt-1">Match Score</p>
              </div>
            </div>

            <div class="card-actions mt-4">
              <button class="btn btn-secondary btn-outline" aria-label="Start interview for current job" @click="startJobInterview">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Interview This Job
              </button>

              <button
                class="btn btn-primary"
                aria-label="Apply to this job"
                @click="showApplyModal = true"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Apply Now
              </button>

              <button
                class="btn btn-outline"
                :class="{ 'btn-success': isSaved }"
                :aria-label="isSaved ? 'Unsave this job' : 'Save this job'"
                @click="handleSaveToggle"
              >
                <svg class="w-5 h-5" :stroke="isSaved ? 'currentColor' : 'currentColor'" :fill="isSaved ? 'currentColor' : 'none'" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {{ isSaved ? "Saved" : "Save Job" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Job Description -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">Job Description</h2>
            <div class="prose max-w-none">
              <p class="whitespace-pre-wrap">{{ job.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="job.requirements?.length" class="divider divider-primary">Requirements</div>

        <!-- Requirements -->
        <div v-if="job.requirements?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">Requirements</h2>
            <ul class="list-disc list-inside space-y-2">
              <li v-for="(req, idx) in job.requirements" :key="idx">
                {{ req }}
              </li>
            </ul>
          </div>
        </div>

        <div v-if="job.technologies?.length" class="divider divider-primary">Technologies</div>

        <!-- Technologies -->
        <div v-if="job.technologies?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">Technologies</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tech in job.technologies"
                :key="tech"
                class="badge badge-lg badge-primary"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>

        <!-- Match Score Breakdown -->
        <div v-if="job.matchBreakdown" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">Match Score Breakdown</h2>
            <div class="space-y-3">
              <div v-for="(item, key) in job.matchBreakdown" :key="key">
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium">{{ key }}</span>
                  <span class="text-sm">{{ item.score }}%</span>
                </div>
                <progress class="progress progress-primary w-full" :value="item.score" max="100" aria-label="Score progress"></progress>
                <p class="text-xs text-base-content/60 mt-1">{{ item.reason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Company Info -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">Company Info</h2>

            <div class="space-y-3">
              <div v-if="job.company">
                <p class="text-xs text-base-content/60">Company</p>
                <p class="font-medium">{{ job.company }}</p>
              </div>

              <div v-if="job.studioType">
                <p class="text-xs text-base-content/60">Studio Type</p>
                <p class="font-medium">{{ job.studioType }}</p>
              </div>

              <div v-if="job.website">
                <p class="text-xs text-base-content/60">Website</p>
                <a :href="job.website" target="_blank" rel="noopener noreferrer" class="link link-primary">
                  Visit Website
                </a>
              </div>

              <div v-if="job.postedAt">
                <p class="text-xs text-base-content/60">Posted</p>
                <p class="font-medium">{{ formatDate(job.postedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Games -->
        <div v-if="job.games?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">Notable Games</h2>
            <ul class="space-y-2">
              <li v-for="game in job.games" :key="game" class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {{ game }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Platforms -->
        <div v-if="job.platforms?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">Platforms</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="platform in job.platforms"
                :key="platform"
                class="badge"
              >
                {{ platform }}
              </span>
            </div>
          </div>
        </div>

        <!-- Genres -->
        <div v-if="job.genres?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">Genres</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="genre in job.genres"
                :key="genre"
                class="badge"
              >
                {{ genre }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Modal -->
    <dialog
      ref="applyDialogRef"
      class="modal modal-bottom sm:modal-middle"
      aria-label="Apply to job dialog"
      @close="showApplyModal = false"
    >
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Apply to {{ job?.title }}</h3>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Application Notes (Optional)</legend>
          <textarea
            v-model="applicationNotes"
            class="textarea textarea-bordered w-full"
            rows="5"
            placeholder="Add any notes about this application..."
            aria-label="Add any notes about this application..."></textarea>
        </fieldset>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            aria-label="Cancel job application"
            @click="showApplyModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            aria-label="Submit job application"
            :disabled="applying"
            @click="handleApply"
          >
            <span v-if="applying" class="loading loading-spinner loading-xs"></span>
            Submit Application
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Close apply dialog" @click="showApplyModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
