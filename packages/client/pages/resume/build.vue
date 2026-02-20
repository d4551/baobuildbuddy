<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
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
const { t } = useI18n();

const phase = ref<"target" | "generating" | "questions" | "synthesizing">("target");
const targetRole = ref("");
const studioName = ref("");
const studioId = ref("");
const experienceLevel = ref("");
const aiQuestions = ref<Array<{ id: string; question: string; category: string }>>([]);
const answers = reactive<Record<string, string>>({});
const currentQuestionIndex = ref(0);
const errorMessage = ref("");
const experienceLevelOptions = [
  { value: "Entry", labelKey: "resumeBuildPage.experienceLevels.entry" },
  { value: "Mid", labelKey: "resumeBuildPage.experienceLevels.mid" },
  { value: "Senior", labelKey: "resumeBuildPage.experienceLevels.senior" },
  { value: "Lead", labelKey: "resumeBuildPage.experienceLevels.lead" },
] as const;

if (import.meta.server) {
  useServerSeoMeta({
    title: t("resumeBuildPage.seoTitle"),
    description: t("resumeBuildPage.seoDescription"),
  });
}

onMounted(async () => {
  await searchStudios();
});

const selectedStudio = computed(() =>
  studioId.value ? studios.value.find((s) => s.id === studioId.value) : null,
);

const displayedStudioName = computed(() => selectedStudio.value?.name ?? studioName.value);

const canProceedTarget = computed(() => targetRole.value.trim().length > 0);

const currentQuestion = computed(() => aiQuestions.value[currentQuestionIndex.value] ?? null);

const progressValue = computed(() => {
  if (phase.value === "target") return 0;
  if (phase.value === "generating" || phase.value === "synthesizing") return 50;
  if (phase.value === "questions" && aiQuestions.value.length > 0) {
    const answered = aiQuestions.value.filter(
      (q) => (answers[q.id] ?? "").trim().length > 0,
    ).length;
    return 25 + (answered / aiQuestions.value.length) * 50;
  }
  return 25;
});

async function generateQuestions() {
  errorMessage.value = "";
  if (!canProceedTarget.value) return;
  phase.value = "generating";
  const requestPayload: {
    targetRole: string;
    studioName?: string;
    experienceLevel?: string;
  } = {
    targetRole: targetRole.value.trim(),
  };
  const normalizedStudioName = displayedStudioName.value.trim();
  if (normalizedStudioName) {
    requestPayload.studioName = normalizedStudioName;
  }
  const normalizedExperienceLevel = experienceLevel.value.trim();
  if (normalizedExperienceLevel) {
    requestPayload.experienceLevel = normalizedExperienceLevel;
  }

  const questionsResult = await settlePromise(
    generateCvQuestions(requestPayload),
    t("resumeBuildPage.errors.generateQuestions"),
  );
  if (!questionsResult.ok) {
    errorMessage.value = getErrorMessage(
      questionsResult.error,
      t("resumeBuildPage.errors.generateQuestions"),
    );
    phase.value = "target";
    $toast.error(errorMessage.value);
    return;
  }

  const questions = questionsResult.value;
  if (questions.length === 0) {
    errorMessage.value = t("resumeBuildPage.errors.emptyQuestions");
    phase.value = "target";
    return;
  }

  aiQuestions.value = questions;
  currentQuestionIndex.value = 0;
  Object.keys(answers).forEach((k) => delete answers[k]);
  questions.forEach((q) => (answers[q.id] = ""));
  phase.value = "questions";
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
  const questionsAndAnswers = aiQuestions.value.map((q) => ({
    id: q.id,
    question: q.question,
    answer: (answers[q.id] ?? "").trim(),
    category: q.category,
  }));

  const synthesizeResult = await settlePromise(
    synthesizeCvResume(questionsAndAnswers),
    t("resumeBuildPage.errors.createResume"),
  );
  if (!synthesizeResult.ok) {
    errorMessage.value = getErrorMessage(
      synthesizeResult.error,
      t("resumeBuildPage.errors.createResume"),
    );
    phase.value = "questions";
    $toast.error(errorMessage.value);
    return;
  }

  const resumeId = synthesizeResult.value?.id;
  if (resumeId) {
    $toast.success(t("resumeBuildPage.toasts.resumeCreated"));
    router.push(APP_ROUTE_BUILDERS.resumeEditor(resumeId));
    return;
  }

  errorMessage.value = t("resumeBuildPage.errors.createResume");
  phase.value = "questions";
  $toast.error(errorMessage.value);
}

function backToTarget() {
  phase.value = "target";
  aiQuestions.value = [];
  errorMessage.value = "";
}
</script>

<template>
  <div class="container mx-auto max-w-3xl py-8">
    <h1 class="text-3xl font-bold mb-2">{{ t("resumeBuildPage.title") }}</h1>
    <p class="text-base-content/70 mb-8">
      {{ t("resumeBuildPage.subtitle") }}
    </p>

    <progress
      class="progress progress-primary w-full mb-8"
      :value="progressValue"
      max="100"
      :aria-label="t('resumeBuildPage.progressAria')"
    ></progress>

    <div v-if="phase === 'target'" class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title">{{ t("resumeBuildPage.target.title") }}</h2>
        <p class="text-sm text-base-content/70 mb-4">
          {{ t("resumeBuildPage.target.description") }}
        </p>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("resumeBuildPage.target.roleLegend") }}</legend>
          <label for="target-role" class="label">{{ t("resumeBuildPage.target.roleLabel") }}</label>
          <input
            id="target-role"
            v-model="targetRole"
            type="text"
            class="input input-bordered w-full"
            :placeholder="t('resumeBuildPage.target.rolePlaceholder')"
            :aria-label="t('resumeBuildPage.target.roleAria')"
          />
        </fieldset>

        <fieldset class="fieldset mt-4">
          <legend class="fieldset-legend">{{ t("resumeBuildPage.target.studioLegend") }}</legend>
          <label for="studio-select" class="label">{{ t("resumeBuildPage.target.studioLabel") }}</label>
          <select
            id="studio-select"
            v-model="studioId"
            class="select select-bordered w-full"
            :aria-label="t('resumeBuildPage.target.studioAria')"
          >
            <option value="">{{ t("resumeBuildPage.target.noStudioOption") }}</option>
            <option v-for="s in studios" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
          <label for="studio-name" class="label mt-2">{{ t("resumeBuildPage.target.studioNameLabel") }}</label>
          <input
            id="studio-name"
            v-model="studioName"
            type="text"
            class="input input-bordered w-full"
            :placeholder="t('resumeBuildPage.target.studioNamePlaceholder')"
            :aria-label="t('resumeBuildPage.target.studioNameAria')"
          />
        </fieldset>

        <fieldset class="fieldset mt-4">
          <legend class="fieldset-legend">{{ t("resumeBuildPage.target.experienceLegend") }}</legend>
          <select
            id="experience-level"
            v-model="experienceLevel"
            class="select select-bordered w-full"
            :aria-label="t('resumeBuildPage.target.experienceAria')"
          >
            <option value="">{{ t("resumeBuildPage.experienceLevels.any") }}</option>
            <option
              v-for="option in experienceLevelOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ t(option.labelKey) }}
            </option>
          </select>
        </fieldset>

        <p v-if="errorMessage" class="text-error text-sm mt-2">{{ errorMessage }}</p>

        <div class="card-actions justify-end mt-6">
          <button
            class="btn btn-primary"
            :disabled="!canProceedTarget"
            :aria-label="t('resumeBuildPage.target.generateAria')"
            @click="generateQuestions"
          >
            {{ t("resumeBuildPage.target.generateButton") }}
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="phase === 'generating'" class="card bg-base-200">
      <div class="card-body items-center justify-center min-h-48">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/70 mt-4">{{ t("resumeBuildPage.generatingLabel") }}</p>
      </div>
    </div>

    <div v-else-if="phase === 'questions'" class="card bg-base-200">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">
            {{
              t("resumeBuildPage.questions.title", {
                current: currentQuestionIndex + 1,
                total: aiQuestions.length,
              })
            }}
          </h2>
          <button
            class="btn btn-ghost btn-sm"
            :aria-label="t('resumeBuildPage.questions.changeTargetAria')"
            @click="backToTarget"
          >
            {{ t("resumeBuildPage.questions.changeTargetButton") }}
          </button>
        </div>

        <fieldset v-if="currentQuestion" class="fieldset">
          <legend class="fieldset-legend">{{ currentQuestion.category }}</legend>
          <label :for="`answer-${currentQuestion.id}`" class="label">{{ currentQuestion.question }}</label>
          <textarea
            :id="`answer-${currentQuestion.id}`"
            v-model="answers[currentQuestion.id]"
            class="textarea textarea-bordered w-full"
            rows="4"
            :placeholder="t('resumeBuildPage.questions.answerPlaceholder', { question: currentQuestion.question })"
            :aria-label="t('resumeBuildPage.questions.answerAria', { question: currentQuestion.question })"
          />
        </fieldset>

        <p v-if="errorMessage" class="text-error text-sm mt-2">{{ errorMessage }}</p>

        <div class="card-actions justify-between mt-6">
          <button
            class="btn btn-ghost"
            :disabled="currentQuestionIndex === 0"
            :aria-label="t('resumeBuildPage.questions.backAria')"
            @click="prevQuestion"
          >
            {{ t("resumeBuildPage.questions.backButton") }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="!answers[currentQuestion?.id ?? '']?.trim()"
            :aria-label="t('resumeBuildPage.questions.nextAria')"
            @click="nextQuestion"
          >
            {{
              currentQuestionIndex < aiQuestions.length - 1
                ? t("resumeBuildPage.questions.nextButton")
                : t("resumeBuildPage.questions.createResumeButton")
            }}
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="phase === 'synthesizing'" class="card bg-base-200">
      <div class="card-body items-center justify-center min-h-48">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/70 mt-4">{{ t("resumeBuildPage.synthesizingLabel") }}</p>
      </div>
    </div>
  </div>
</template>
