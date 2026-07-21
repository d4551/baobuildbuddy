<script setup lang="ts">
defineOptions({ name: "PagesResumeBuildPage" });

import { FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS } from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
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

useSeoMeta({
  title: t("resumeBuildPage.seoTitle"),
  description: t("resumeBuildPage.seoDescription"),
});

onMounted(async () => {
  await searchStudios();
});

const selectedStudio = computed(() =>
  studioId.value ? studios.value.find((s) => s.id === studioId.value) : null,
);

const displayedStudioName = computed(() => selectedStudio.value?.name ?? studioName.value);

const canProceedTarget = computed(() => targetRole.value.trim().length > 0);

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
  for (const k of Object.keys(answers)) {
    delete answers[k];
  }
  for (const q of questions) {
    answers[q.id] = "";
  }
  phase.value = "questions";
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) currentQuestionIndex.value--;
}

async function nextQuestion() {
  if (currentQuestionIndex.value < aiQuestions.value.length - 1) {
    currentQuestionIndex.value++;
  } else {
    await finishAndSynthesize();
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

  const synthesizedResume = synthesizeResult.value;
  const resumeId =
    typeof synthesizedResume === "object" &&
    synthesizedResume !== null &&
    "id" in synthesizedResume &&
    typeof synthesizedResume.id === "string"
      ? synthesizedResume.id
      : "";
  if (resumeId.length > 0) {
    $toast.success(t("resumeBuildPage.toasts.resumeCreated"));
    await router.push(APP_ROUTE_BUILDERS.resumeEditor(resumeId));
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
  <PageScaffold tag="section" width-token="narrow" spacing-token="comfortable" labelled-by="resume-build-title">
    <PageHeaderBlock
      title-id="resume-build-title"
      :title="t('resumeBuildPage.title')"
      :description="t('resumeBuildPage.subtitle')"
    />

    <progress
      class="progress progress-primary" :class="[FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS.mb8]"
      :value="progressValue"
      max="100"
      :aria-label="t('resumeBuildPage.progressAria')"
    ></progress>

    <ResumeBuildTargetCard
      v-if="phase === 'target'"
      v-model:target-role="targetRole"
      v-model:studio-name="studioName"
      v-model:studio-id="studioId"
      v-model:experience-level="experienceLevel"
      :studios="studios"
      :experience-level-options="experienceLevelOptions"
      :can-proceed-target="canProceedTarget"
      :error-message="errorMessage"
      :t="t"
      @generate="generateQuestions"
    />

    <ResumeBuildStatusCard
      v-else-if="phase === 'generating'"
      :loading-label="t('resumeBuildPage.generatingLabel')"
    />

    <ResumeBuildQuestionsCard
      v-else-if="phase === 'questions'"
      v-model:answers="answers"
      :ai-questions="aiQuestions"
      :current-question-index="currentQuestionIndex"
      :error-message="errorMessage"
      :t="t"
      @previous="prevQuestion"
      @next="nextQuestion"
      @change-target="backToTarget"
    />

    <ResumeBuildStatusCard
      v-else-if="phase === 'synthesizing'"
      :loading-label="t('resumeBuildPage.synthesizingLabel')"
    />
  </PageScaffold>
</template>
