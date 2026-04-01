import {
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_FOCUS_AREAS,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_CATEGORY,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
} from "@bao/shared/constants/interview";
import type {
  InterviewCandidateContext,
  InterviewConversationStyle,
  InterviewTargetJob,
  VoiceSettings,
} from "@bao/shared/types/interview";
import { asString, asStringArray } from "@bao/shared/utils/type-guards";
import type { CreateSessionConfigInput, SubmitResponseBody } from "./interview-route-contracts";

const asNonNegativeInt = (value: number | undefined): number | undefined => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return;
};

const asStringArrayTrimmed = (value: unknown): string[] =>
  asStringArray(value)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

function applyStringFields<T extends object>(
  target: T,
  fields: Array<[string, string | undefined]>,
): T {
  for (const [key, value] of fields) {
    if (value) {
      Object.assign(target, { [key]: value });
    }
  }
  return target;
}

const parseTargetJob = (
  value: CreateSessionConfigInput["targetJob"],
): InterviewTargetJob | undefined => {
  if (!value) return;
  const id = asString(value.id);
  const title = asString(value.title);
  const company = asString(value.company);
  const location = asString(value.location);
  if (!(id && title && company && location)) {
    return;
  }

  const targetJob: InterviewTargetJob = { id, title, company, location };
  const requirements = asStringArrayTrimmed(value.requirements);
  const technologies = asStringArrayTrimmed(value.technologies);
  const description = asString(value.description);
  const source = asString(value.source);
  const postedDate = asString(value.postedDate);
  const url = asString(value.url);

  applyStringFields(targetJob, [["description", description]]);
  if (requirements.length > 0) targetJob.requirements = requirements;
  if (technologies.length > 0) targetJob.technologies = technologies;
  applyStringFields(targetJob, [
    ["source", source],
    ["postedDate", postedDate],
    ["url", url],
  ]);

  return targetJob;
};

const normalizeVoiceSettings = (
  value: CreateSessionConfigInput["voiceSettings"],
): VoiceSettings | undefined => {
  if (!value) {
    return;
  }

  const normalized: VoiceSettings = {
    rate: typeof value.rate === "number" ? value.rate : INTERVIEW_DEFAULT_VOICE_SETTINGS.rate,
    pitch: typeof value.pitch === "number" ? value.pitch : INTERVIEW_DEFAULT_VOICE_SETTINGS.pitch,
    volume:
      typeof value.volume === "number" ? value.volume : INTERVIEW_DEFAULT_VOICE_SETTINGS.volume,
    language: asString(value.language) || INTERVIEW_DEFAULT_VOICE_SETTINGS.language,
  };
  const microphoneId = asString(value.microphoneId);
  const speakerId = asString(value.speakerId);
  const voiceId = asString(value.voiceId);

  applyStringFields(normalized, [
    ["microphoneId", microphoneId],
    ["speakerId", speakerId],
    ["voiceId", voiceId],
  ]);

  return normalized;
};

const parseCandidateContext = (
  value: CreateSessionConfigInput["candidateContext"],
): InterviewCandidateContext | undefined => {
  if (!value) {
    return;
  }

  const resumeId = asString(value.resumeId);
  const coverLetterId = asString(value.coverLetterId);
  const portfolioId = asString(value.portfolioId);
  if (!(resumeId || coverLetterId || portfolioId)) {
    return;
  }

  const context: InterviewCandidateContext = {};
  applyStringFields(context, [
    ["resumeId", resumeId],
    ["coverLetterId", coverLetterId],
    ["portfolioId", portfolioId],
  ]);
  return context;
};

const parseConversationStyle = (
  value: CreateSessionConfigInput["conversationStyle"],
): InterviewConversationStyle | undefined => {
  if (value === "structured") return "structured";
  if (value === "natural") return "natural";
  return;
};

export const sessionConfigFromUi = (config: CreateSessionConfigInput): CreateSessionConfigInput => {
  const targetJob = parseTargetJob(config.targetJob);
  const roleTypeFromJob = asString(targetJob?.title);
  const focusAreas = asStringArrayTrimmed(config.focusAreas);

  return {
    roleType: asString(config.roleType) || roleTypeFromJob || INTERVIEW_DEFAULT_ROLE_TYPE,
    roleCategory: asString(config.roleCategory) || INTERVIEW_DEFAULT_ROLE_CATEGORY,
    experienceLevel: asString(config.experienceLevel) || INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
    focusAreas: focusAreas.length > 0 ? focusAreas : [...INTERVIEW_DEFAULT_FOCUS_AREAS],
    duration: config.duration,
    questionCount: asNonNegativeInt(config.questionCount) ?? INTERVIEW_DEFAULT_QUESTION_COUNT,
    includeTechnical: config.includeTechnical,
    includeBehavioral: config.includeBehavioral,
    includeStudioSpecific: config.includeStudioSpecific,
    enableVoiceMode: config.enableVoiceMode,
    technologies: asStringArrayTrimmed(config.technologies),
    voiceSettings: normalizeVoiceSettings(config.voiceSettings),
    interviewMode: config.interviewMode === "job" ? "job" : "studio",
    conversationStyle: parseConversationStyle(config.conversationStyle),
    targetJob,
    candidateContext: parseCandidateContext(config.candidateContext),
  };
};

export const parseResponsePayload = (body: SubmitResponseBody) => {
  const response = asString(body.response);
  if (!response) {
    return null;
  }

  const questionId = asString(body.questionId);
  const questionIndex = asNonNegativeInt(body.questionIndex);
  return {
    questionId: questionId ?? `index:${questionIndex ?? 0}`,
    questionIndex,
    response,
  };
};
