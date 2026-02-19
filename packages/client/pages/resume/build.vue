<script setup lang="ts">
/**
 * AI-Driven CV Builder - wizard flow:
 * 1) Select target role/studio
 * 2) AI generates ~8–12 questions
 * 3) User answers questions
 * 4) AI synthesizes into ResumeData, creates resume, redirect to editor
 */
const { generateCvQuestions, synthesizeCvResume } = useResume();
const { studios, searchStudios } = useStudio();
const router = useRouter();
const { $toast } = useNuxtApp();

const phase = ref<"target" | "generating" | "questions" | "synthesizing">("target");
const targetRole = ref("");
const studioName = ref("");
const studioId = ref("");
const experienceLevel = ref("");
const aiQuestions = ref<Array<{ id: string; question: string; category: string }>>([]);
const answers = reactive<Record<string, string>>({});
const currentQuestionIndex = ref(0);
const errorMessage = ref("");

onMounted(async () => {
  await searchStudios();
});

const selectedStudio = computed(() =>
  studioId.value ? studios.value.find((s) => s.id === studioId.value) : null,
);

const displayedStudioName = computed(() => selectedStudio.value?.name ?? studioName.value);

const canProceedTarget = computed(() => targetRole.value.trim().length > 0);

const questionsComplete = computed(() =>
  aiQuestions.value.length > 0 && aiQuestions.value.every((q) => (answers[q.id] ?? "").trim().length > 0),
);

const currentQuestion = computed(() => aiQuestions.value[currentQuestionIndex.value] ?? null);

const progressValue = computed(() => {
  if (phase.value === "target") return 0;
  if (phase.value === "generating" || phase.value === "synthesizing") return 50;
  if (phase.value === "questions" && aiQuestions.value.length > 0) {
    const answered = aiQuestions.value.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
    return 25 + (answered / aiQuestions.value.length) * 50;
  }
  return 25;
});

async function generateQuestions() {
  errorMessage.value = "";
  if (!canProceedTarget.value) return;
  phase.value = "generating";
  try {
    const questions = await generateCvQuestions({
      targetRole: targetRole.value.trim(),
      studioName: displayedStudioName.value || undefined,
      experienceLevel: experienceLevel.value.trim() || undefined,
    });
    if (questions.length === 0) {
      errorMessage.value = "No questions were generated. Please try again.";
      phase.value = "target";
      return;
    }
    aiQuestions.value = questions;
    currentQuestionIndex.value = 0;
    Object.keys(answers).forEach((k) => delete answers[k]);
    questions.forEach((q) => (answers[q.id] = ""));
    phase.value = "questions";
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : "Failed to generate questions";
    phase.value = "target";
    $toast.error(errorMessage.value);
  }
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) currentQuestionIndex.value--;
}

function nextQuestion() {
  if (currentQuestionIndex.value < aiQuestions.value.length - 1) {
    currentQuestionIndex.value++;
  } else {
    finishAndSynthesize();
  }
}

async function finishAndSynthesize() {
  errorMessage.value = "";
  phase.value = "synthesizing";
  try {
    const questionsAndAnswers = aiQuestions.value.map((q) => ({
      id: q.id,
      question: q.question,
      answer: (answers[q.id] ?? "").trim(),
      category: q.category,
    }));
    const created = await synthesizeCvResume(questionsAndAnswers);
    const resumeId = created?.id;
    if (resumeId) {
      $toast.success("Resume created");
      router.push({ path: "/resume", query: { id: resumeId } });
    } else {
      throw new Error("Failed to create resume");
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : "Failed to create resume";
    phase.value = "questions";
    $toast.error(errorMessage.value);
  }
}

function backToTarget() {
  phase.value = "target";
  aiQuestions.value = [];
  errorMessage.value = "";
}
</script>

<template>
  <div class="container mx-auto max-w-3xl py-8">
    <h1 class="text-3xl font-bold mb-2">Build Your CV with AI</h1>
    <p class="text-base-content/70 mb-8">
      Tell us your target role and studio. We'll generate tailored questions and create your resume.
    </p>

    <progress class="progress progress-primary w-full mb-8" :value="progressValue" max="100"></progress>

    <!-- Phase: Target role/studio -->
    <div v-if="phase === 'target'" class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title">Target Role &amp; Studio</h2>
        <p class="text-sm text-base-content/70 mb-4">
          What role are you targeting? Optionally select a studio to tailor the questions.
        </p>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Target Role</legend>
          <label for="target-role" class="label">e.g. Game Designer at AAA studio, Junior Programmer</label>
          <input
            id="target-role"
            v-model="targetRole"
            type="text"
            class="input input-bordered w-full"
            placeholder="e.g. Game Designer at AAA studio"
          />
        </fieldset>

        <fieldset class="fieldset mt-4">
          <legend class="fieldset-legend">Studio (optional)</legend>
          <label for="studio-select" class="label">Pick a studio to tailor questions</label>
          <select
            id="studio-select"
            v-model="studioId"
            class="select select-bordered w-full"
          >
            <option value="">None selected</option>
            <option v-for="s in studios" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
          <label for="studio-name" class="label mt-2">Or type studio name</label>
          <input
            id="studio-name"
            v-model="studioName"
            type="text"
            class="input input-bordered w-full"
            placeholder="e.g. Epic Games"
          />
        </fieldset>

        <fieldset class="fieldset mt-4">
          <legend class="fieldset-legend">Experience Level (optional)</legend>
          <select
            id="experience-level"
            v-model="experienceLevel"
            class="select select-bordered w-full"
          >
            <option value="">Any</option>
            <option value="Entry">Entry</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
        </fieldset>

        <p v-if="errorMessage" class="text-error text-sm mt-2">{{ errorMessage }}</p>

        <div class="card-actions justify-end mt-6">
          <button
            class="btn btn-primary"
            :disabled="!canProceedTarget"
            @click="generateQuestions"
          >
            Generate Questions
          </button>
        </div>
      </div>
    </div>

    <!-- Phase: Generating -->
    <div v-else-if="phase === 'generating'" class="card bg-base-200">
      <div class="card-body items-center justify-center min-h-48">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/70 mt-4">Generating tailored questions...</p>
      </div>
    </div>

    <!-- Phase: Answer questions -->
    <div v-else-if="phase === 'questions'" class="card bg-base-200">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">
            Question {{ currentQuestionIndex + 1 }} of {{ aiQuestions.length }}
          </h2>
          <button class="btn btn-ghost btn-sm" @click="backToTarget">Change target</button>
        </div>

        <fieldset v-if="currentQuestion" class="fieldset">
          <legend class="fieldset-legend">{{ currentQuestion.category }}</legend>
          <label :for="`answer-${currentQuestion.id}`" class="label">{{ currentQuestion.question }}</label>
          <textarea
            :id="`answer-${currentQuestion.id}`"
            v-model="answers[currentQuestion.id]"
            class="textarea textarea-bordered w-full"
            rows="4"
            :placeholder="`Your answer for: ${currentQuestion.question}`"
          />
        </fieldset>

        <p v-if="errorMessage" class="text-error text-sm mt-2">{{ errorMessage }}</p>

        <div class="card-actions justify-between mt-6">
          <button
            class="btn btn-ghost"
            :disabled="currentQuestionIndex === 0"
            @click="prevQuestion"
          >
            Back
          </button>
          <button
            class="btn btn-primary"
            :disabled="!answers[currentQuestion?.id ?? '']?.trim()"
            @click="nextQuestion"
          >
            {{ currentQuestionIndex < aiQuestions.length - 1 ? "Next" : "Create Resume" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Phase: Synthesizing -->
    <div v-else-if="phase === 'synthesizing'" class="card bg-base-200">
      <div class="card-body items-center justify-center min-h-48">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/70 mt-4">Creating your resume...</p>
      </div>
    </div>
  </div>
</template>
