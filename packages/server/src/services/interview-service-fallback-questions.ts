import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
} from "@bao/shared/types/interview";
import type {
  CandidateInterviewContext,
  FallbackInterviewContext,
  StudioContext,
} from "./interview-service-contracts";

const FALLBACK_INTERVIEW_QUESTIONS: Array<Omit<InterviewQuestion, "id">> = [
  {
    type: "intro",
    difficulty: "easy",
    question:
      "Tell me about a game feature or system you shipped recently and the tradeoffs you made.",
    followUps: [
      "What constraints shaped your implementation?",
      "What would you do differently now?",
      "How did you validate it with stakeholders?",
    ],
    expectedDuration: 120,
    tags: ["systems", "delivery"],
  },
  {
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a time you disagreed on technical direction with a teammate.",
    followUps: [
      "How did you resolve the disagreement?",
      "What evidence helped persuade the team?",
      "What did you learn?",
    ],
    expectedDuration: 120,
    tags: ["collaboration", "communication"],
  },
  {
    type: "studio-specific",
    difficulty: "medium",
    question: "What would you do in your first 30 days at this studio?",
    followUps: [
      "Which teams would you partner with first?",
      "How would you reduce context-switching?",
      "What deliverable would you own first?",
    ],
    expectedDuration: 150,
    tags: ["ownership", "planning"],
  },
  {
    type: "technical",
    difficulty: "medium",
    question: "How do you approach debugging intermittent gameplay or networking issues?",
    followUps: [
      "What instrumentation do you rely on first?",
      "How do you isolate repro steps?",
      "How do you confirm the fix is stable?",
    ],
    expectedDuration: 180,
    tags: ["debugging", "quality"],
  },
  {
    type: "technical",
    difficulty: "hard",
    question:
      "Design a robust retry strategy for an unstable API used during runtime content updates.",
    followUps: [
      "How do you avoid thundering-herd failures?",
      "What metrics indicate your strategy is healthy?",
      "How do you communicate outage risk to PMs?",
    ],
    expectedDuration: 180,
    tags: ["architecture", "resilience"],
  },
  {
    type: "closing",
    difficulty: "easy",
    question: "Why should this studio choose you for this role right now?",
    followUps: [
      "Which accomplishment best proves that?",
      "How do you grow with new team members?",
      "What would you ship in your first sprint?",
    ],
    expectedDuration: 120,
    tags: ["fit", "ownership"],
  },
];

const SUMMARY_HIGHLIGHT_SPLIT_PATTERN = /[;,]/u;

function extractSummaryValue(summary: string, label: string): string {
  const matcher = new RegExp(`^- ${label}:\\s*(.+)$`, "im");
  return summary.match(matcher)?.[1]?.trim() ?? "";
}

function extractSummaryHighlights(summary: string, label: string, maxItems = 3): string[] {
  return extractSummaryValue(summary, label)
    .split(SUMMARY_HIGHLIGHT_SPLIT_PATTERN)
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value !== DEFAULT_UNSPECIFIED_LABEL)
    .slice(0, maxItems);
}

function buildFallbackInterviewContext(
  studio: StudioContext,
  config: InterviewConfig,
  candidateContext: CandidateInterviewContext,
): FallbackInterviewContext {
  const targetJob = config.targetJob;
  const interviewEntity =
    config.interviewMode === "job" && targetJob?.company ? targetJob.company : studio.name;
  const roleTarget = targetJob?.title || config.roleType;
  const technicalHighlights =
    targetJob?.technologies?.filter((value) => value.trim().length > 0) ??
    extractSummaryHighlights(candidateContext.resumeSummary, "Technical skills");

  return {
    interviewEntity,
    roleTarget,
    primaryTechnology:
      technicalHighlights.find((value) => value.length > 0) ?? "your strongest technical stack",
    experienceHighlight:
      extractSummaryHighlights(candidateContext.resumeSummary, "Experience highlights", 1)[0] ??
      extractSummaryHighlights(candidateContext.profileSummary, "Current role", 1)[0] ??
      "recent game-industry delivery work",
    projectHighlight:
      extractSummaryHighlights(candidateContext.resumeSummary, "Project highlights", 1)[0] ??
      extractSummaryHighlights(candidateContext.portfolioSummary, "Featured work", 1)[0] ??
      "a player-facing system you shipped",
    focusArea:
      targetJob?.enrichment?.interviewFocusAreas?.[0] ??
      studio.enrichment?.interviewFocusAreas?.[0] ??
      "cross-functional delivery",
    hiringSignal:
      targetJob?.enrichment?.hiringSignals?.[0] ??
      studio.enrichment?.hiringSignals?.[0] ??
      "shipping velocity and collaborative execution",
    pitchAngle:
      targetJob?.enrichment?.candidatePitchAngles?.[0] ??
      studio.enrichment?.candidatePitchAngles?.[0] ??
      "measurable player impact and ownership",
  };
}

type FallbackQuestionContent = { question: string; followUps: string[]; tags: string[] };

const FALLBACK_QUESTION_BUILDERS: Record<
  InterviewQuestion["type"],
  (
    seed: Omit<InterviewQuestion, "id">,
    context: FallbackInterviewContext,
  ) => FallbackQuestionContent
> = {
  intro: (seed, context) => ({
    question: `Your background highlights ${context.experienceHighlight}. How does that prepare you for the ${context.roleTarget} role at ${context.interviewEntity}?`,
    followUps: [
      `Which result from ${context.projectHighlight} is most relevant to ${context.interviewEntity}?`,
      "How did you validate the outcome with teammates, stakeholders, or players?",
      "What tradeoff from that work would you handle differently now?",
    ],
    tags: [...seed.tags, "candidate-context", "role-context"],
  }),
  behavioral: (seed, context) => ({
    question: `Tell me about a time you aligned design, QA, or production partners to deliver ${context.focusArea} work with a clear outcome.`,
    followUps: [
      "What disagreement or constraint made the collaboration difficult?",
      "How did you keep the team aligned when priorities shifted?",
      "What evidence told you the collaboration was successful?",
    ],
    tags: [...seed.tags, "candidate-context", "collaboration"],
  }),
  "studio-specific": (seed, context) => ({
    question: `${context.interviewEntity} is signaling ${context.hiringSignal}. How would you ramp up in your first 30 days and show that ${context.pitchAngle}?`,
    followUps: [
      `Which stakeholder would you meet first to support ${context.focusArea}?`,
      "What deliverable would you aim to own by the end of your first sprint?",
      "How would you tailor your communication to this studio context?",
    ],
    tags: [...seed.tags, "studio-context", "scrape-enrichment"],
  }),
  technical: (seed, context) => ({
    question: `Walk me through ${context.projectHighlight} where you used ${context.primaryTechnology} in a way that would transfer directly to the ${context.roleTarget} scope at ${context.interviewEntity}.`,
    followUps: [
      `What constraints shaped your use of ${context.primaryTechnology}?`,
      "What telemetry, QA checks, or player signals told you the solution was healthy?",
      "How would you scale that approach for a larger team or live-service environment?",
    ],
    tags: [...seed.tags, "candidate-context", "technical-context"],
  }),
  closing: (seed, context) => ({
    question: `What is the strongest evidence from your resume, cover letter, or portfolio that you are ready for ${context.roleTarget} at ${context.interviewEntity} right now?`,
    followUps: [
      "Which accomplishment best proves that claim?",
      "How does that evidence connect to this studio's priorities?",
      "What would you aim to deliver in your first 30 days?",
    ],
    tags: [...seed.tags, "candidate-context", "closing"],
  }),
};

function buildFallbackQuestionText(
  seed: Omit<InterviewQuestion, "id">,
  context: FallbackInterviewContext,
): FallbackQuestionContent {
  const builder = FALLBACK_QUESTION_BUILDERS[seed.type];
  return builder(seed, context);
}

export function buildFallbackQuestions(
  config: InterviewConfig,
  studio: StudioContext,
  candidateContext: CandidateInterviewContext,
): InterviewQuestion[] {
  const filtered = FALLBACK_INTERVIEW_QUESTIONS.filter((question) => {
    if (question.type === "technical") {
      return Boolean(config.includeTechnical);
    }
    if (question.type === "behavioral") {
      return Boolean(config.includeBehavioral);
    }
    if (question.type === "studio-specific") {
      return Boolean(config.includeStudioSpecific);
    }
    return true;
  });

  const normalizedQuestionCount = Math.max(1, config.questionCount);
  const pool = filtered.length > 0 ? filtered : FALLBACK_INTERVIEW_QUESTIONS;
  const context = buildFallbackInterviewContext(studio, config, candidateContext);
  const questions: InterviewQuestion[] = [];
  const askedQuestions = new Set<string>();

  while (questions.length < normalizedQuestionCount) {
    const seed = pool[questions.length % pool.length];
    const contextualized = buildFallbackQuestionText(seed, context);
    // Builders render from the seed's `type` plus the shared context, so two
    // seeds of the same type — and any pass where the pool wraps — collapse to
    // identical text. Fall back to the seed's own wording so a practice run
    // never asks the same question twice in a row.
    const question = askedQuestions.has(contextualized.question)
      ? seed.question
      : contextualized.question;
    askedQuestions.add(question);
    questions.push({
      ...seed,
      id: `fallback-${questions.length + 1}`,
      question,
      followUps: contextualized.followUps,
      tags: contextualized.tags,
    });
  }

  return questions.slice(0, normalizedQuestionCount);
}

export function buildFallbackNaturalQuestion(
  session: { config: InterviewConfig; responses: InterviewResponse[] },
  studio: StudioContext,
  candidateContext: CandidateInterviewContext,
): InterviewQuestion | null {
  const nextFallback = buildFallbackQuestions(session.config, studio, candidateContext)[
    session.responses.length
  ];

  if (!nextFallback) {
    return null;
  }

  return {
    ...nextFallback,
    id: `natural-fallback-${session.responses.length + 1}`,
  };
}
