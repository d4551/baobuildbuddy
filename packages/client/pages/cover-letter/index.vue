<script setup lang="ts">
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const { coverLetters, loading, fetchCoverLetters, deleteCoverLetter, generateCoverLetter } =
  useCoverLetter();
const router = useRouter();
const { $toast } = useNuxtApp();

const showGenerateModal = ref(false);
const generating = ref(false);
const generateDialogRef = ref<HTMLDialogElement | null>(null);
const generateForm = reactive({
  company: "",
  position: "",
  jobDescription: "",
  template: "professional",
});

onMounted(() => {
  fetchCoverLetters();
});

watch(showGenerateModal, (isOpen) => {
  const dialog = generateDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

async function handleDelete(id: string) {
  if (confirm("Are you sure you want to delete this cover letter?")) {
    try {
      await deleteCoverLetter(id);
      $toast.success("Cover letter deleted");
    } catch (error: unknown) {
      $toast.error(getErrorMessage(error, "Failed to delete cover letter"));
    }
  }
}

function editLetter(id: string) {
  router.push(`/cover-letter/${id}`);
}

async function handleGenerate() {
  if (generateForm.company.trim().length < 2) {
    $toast.error("Company name must be at least 2 characters");
    return;
  }

  if (generateForm.position.trim().length < 2) {
    $toast.error("Position must be at least 2 characters");
    return;
  }

  generating.value = true;
  try {
    const letter = await generateCoverLetter(generateForm);
    showGenerateModal.value = false;
    $toast.success("Cover letter generated");
    if (letter?.id) {
      router.push(`/cover-letter/${letter.id}`);
    }
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to generate cover letter"));
  } finally {
    generating.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Cover Letters</h1>
      <button
        class="btn btn-primary btn-sm"
        @click="showGenerateModal = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        AI Generate
      </button>
    </div>

    <LoadingSkeleton v-if="loading && !coverLetters.length" :lines="6" />

    <div v-else-if="coverLetters.length === 0" class="alert">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>No cover letters yet. Generate your first AI-powered cover letter.</span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="letter in coverLetters"
        :key="letter.id"
        class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
        @click="editLetter(letter.id)"
      >
        <div class="card-body">
          <h3 class="card-title text-lg">{{ letter.position }}</h3>
          <p class="text-base-content/70">{{ letter.company }}</p>

          <div class="flex gap-2 mt-2">
            <span class="badge badge-sm">{{ letter.template }}</span>
            <span v-if="letter.createdAt" class="badge badge-sm badge-outline">
              {{ new Date(letter.createdAt).toLocaleDateString() }}
            </span>
          </div>

          <p class="text-sm text-base-content/60 line-clamp-3 mt-2">
            {{ letter.content?.substring(0, 150) }}...
          </p>

          <div class="card-actions justify-end mt-4">
            <button
              class="btn btn-sm btn-outline"
              @click.stop="editLetter(letter.id)"
            >
              Edit
            </button>
            <button
              class="btn btn-sm btn-error btn-outline"
              @click.stop="handleDelete(letter.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate Modal -->
    <dialog ref="generateDialogRef" class="modal" @close="showGenerateModal = false">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Generate Cover Letter with AI</h3>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Company Name</legend>
            <input
              v-model="generateForm.company"
              type="text"
              placeholder="e.g. Riot Games"
              class="input w-full"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Position</legend>
            <input
              v-model="generateForm.position"
              type="text"
              placeholder="e.g. Senior Game Designer"
              class="input w-full"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Job Description (Optional)</legend>
            <textarea
              v-model="generateForm.jobDescription"
              class="textarea textarea-bordered w-full"
              rows="5"
              placeholder="Paste the job description here for a more tailored cover letter..."
            ></textarea>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Template Style</legend>
            <select v-model="generateForm.template" class="select w-full">
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="passionate">Passionate</option>
              <option value="technical">Technical</option>
            </select>
          </fieldset>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            @click="showGenerateModal = false"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="generating || !generateForm.company || !generateForm.position"
            @click="handleGenerate"
          >
            <span v-if="generating" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showGenerateModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
