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
useFocusTrap(generateDialogRef, () => showGenerateModal.value);
const showDeleteCoverLetterDialog = ref(false);
const pendingDeleteCoverLetterId = ref<string | null>(null);
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

function requestDeleteCoverLetter(id: string) {
  pendingDeleteCoverLetterId.value = id;
  showDeleteCoverLetterDialog.value = true;
}

function clearDeleteCoverLetterState() {
  pendingDeleteCoverLetterId.value = null;
}

async function handleDeleteCoverLetter() {
  const id = pendingDeleteCoverLetterId.value;
  if (!id) return;

  try {
    await deleteCoverLetter(id);
    $toast.success("Cover letter deleted");
  } catch (error) {
    $toast.error(getErrorMessage(error, "Failed to delete cover letter"));
  } finally {
    clearDeleteCoverLetterState();
    showDeleteCoverLetterDialog.value = false;
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

  if (generateForm.jobDescription.trim().length > 0 && generateForm.jobDescription.trim().length < 50) {
    $toast.error("Job description must be at least 50 characters when provided");
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
  } catch (error) {
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

    <LoadingSkeleton v-if="loading && !coverLetters.length" variant="cards" :lines="6" />

    <div v-else-if="coverLetters.length === 0" class="alert alert-info alert-soft">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>No cover letters yet. Generate your first AI-powered cover letter.</span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="letter in coverLetters"
        :key="letter.id"
        class="cursor-pointer transition-colors"
        :class="
          letter.content?.trim()
            ? 'card card-border bg-base-100 hover:bg-base-200'
            : 'card card-dash bg-base-100 hover:bg-base-200'
        "
        role="button"
        tabindex="0"
        @click="editLetter(letter.id)"
        @keydown.enter="editLetter(letter.id)"
        @keydown.space.prevent="editLetter(letter.id)"
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
              @click.stop="requestDeleteCoverLetter(letter.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate Modal -->
    <dialog ref="generateDialogRef" class="modal modal-bottom sm:modal-middle" @close="showGenerateModal = false">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Generate Cover Letter with AI</h3>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Company Name</legend>
            <input
              v-model="generateForm.company"
              type="text"
              required
              minlength="2"
              placeholder="e.g. Riot Games"
              class="input validator w-full"
              aria-label="e.g. Riot Games"/>
            <p class="validator-hint">Company name must be at least 2 characters.</p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Position</legend>
            <input
              v-model="generateForm.position"
              type="text"
              required
              minlength="2"
              placeholder="e.g. Senior Game Designer"
              class="input validator w-full"
              aria-label="e.g. Senior Game Designer"/>
            <p class="validator-hint">Position must be at least 2 characters.</p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Job Description (Optional)</legend>
            <textarea
              v-model="generateForm.jobDescription"
              minlength="50"
              class="textarea textarea-bordered validator w-full"
              rows="5"
              placeholder="Paste the job description here for a more tailored cover letter..."
              aria-label="Paste the job description here for a more tailored cover letter..."></textarea>
            <p class="validator-hint">If provided, include at least 50 characters for better AI context.</p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Template Style</legend>
            <select v-model="generateForm.template" required class="select validator w-full" aria-label="Template">
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="passionate">Passionate</option>
              <option value="technical">Technical</option>
            </select>
            <p class="validator-hint">Select a template style before generating.</p>
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

    <ConfirmDialog
      id="cover-letter-delete-dialog"
      v-model:open="showDeleteCoverLetterDialog"
      title="Delete cover letter"
      message="This cover letter will be permanently deleted."
      confirm-text="Delete"
      cancel-text="Cancel"
      variant="danger"
      @confirm="handleDeleteCoverLetter"
      @cancel="clearDeleteCoverLetterState"
    />
  </div>
</template>
