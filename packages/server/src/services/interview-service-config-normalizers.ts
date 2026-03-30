import {
  INTERVIEW_DEFAULT_DURATION_MINUTES,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_FOCUS_AREAS,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_CATEGORY,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
  INTERVIEW_SERVICE_MAX_QUESTION_COUNT,
  normalizeScrapePersonaEnrichment,
  type InterviewCandidateContext,
  type InterviewConfig,
  type InterviewConversationStyle,
  type InterviewMode,
  type InterviewTargetJob,
  type VoiceSettings,
} from "@bao/shared";
import type { InterviewConfigInput } from "./interview-service-contracts";
import {
  isRecord,
  parseBoolean,
  parseNumber,
  parseString,
  parseStringArray,
} from "./interview-service-value-parsers";

const DEFAULT_INTERVIEW_CONVERSATION_STYLE: InterviewConversationStyle = "natural";

export function normalizeInterviewMode(value: unknown): InterviewMode {
  return value === "job" ? "job" : "studio";
}

export function normalizeConversationStyle(value: unknown): InterviewConversationStyle {
  return value === "structured" ? "structured" : DEFAULT_INTERVIEW_CONVERSATION_STYLE;
}

export function normalizeCandidateContext(value: unknown): InterviewCandidateContext | undefined {
  if (!isRecord(value)) {
    return;
  }

  const resumeId = parseString(value.resumeId, "");
  const coverLetterId = parseString(value.coverLetterId, "");
  const portfolioId = parseString(value.portfolioId, "");
  if (!(resumeId || coverLetterId || portfolioId)) {
    return;
  }

  return {
    ...(resumeId ? { resumeId } : {}),
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(portfolioId ? { portfolioId } : {}),
  };
}

export function normalizeInterviewTargetJob(value: unknown): InterviewTargetJob | undefined {
  if (!isRecord(value)) {
    return;
  }

  const id = parseString(value.id, "");
  const title = parseString(value.title, "");
  const company = parseString(value.company, "");
  const location = parseString(value.location, "");
  if (!(id && title && company && location)) {
    return;
  }

  const requirements = parseStringArray(value.requirements);
  const technologies = parseStringArray(value.technologies);
  const description = parseString(value.description, "");
  const source = parseString(value.source, "");
  const postedDate = parseString(value.postedDate, "");
  const url = parseString(value.url, "");
  const enrichment = normalizeScrapePersonaEnrichment(value.enrichment);

  const targetJob: InterviewTargetJob = {
    id,
    title,
    company,
    location,
  };

  if (description) {
    targetJob.description = description;
  }
  if (requirements.length > 0) {
    targetJob.requirements = requirements;
  }
  if (technologies.length > 0) {
    targetJob.technologies = technologies;
  }
  if (source) {
    targetJob.source = source;
  }
  if (postedDate) {
    targetJob.postedDate = postedDate;
  }
  if (url) {
    targetJob.url = url;
  }
  if (enrichment) {
    targetJob.enrichment = enrichment;
  }

  return targetJob;
}

export function normalizeVoiceSettings(raw: unknown): VoiceSettings | undefined {
  if (!isRecord(raw)) {
    return;
  }

  const microphoneId = parseString(raw.microphoneId, "");
  const speakerId = parseString(raw.speakerId, "");
  const voiceId = parseString(raw.voiceId, "");
  const voiceSettings: VoiceSettings = {
    rate: parseNumber(raw.rate, INTERVIEW_DEFAULT_VOICE_SETTINGS.rate, 0.25, 3),
    pitch: parseNumber(raw.pitch, INTERVIEW_DEFAULT_VOICE_SETTINGS.pitch, 0.5, 2),
    volume: parseNumber(raw.volume, INTERVIEW_DEFAULT_VOICE_SETTINGS.volume, 0, 2),
    language: parseString(raw.language, INTERVIEW_DEFAULT_VOICE_SETTINGS.language),
  };

  if (microphoneId) {
    voiceSettings.microphoneId = microphoneId;
  }
  if (speakerId) {
    voiceSettings.speakerId = speakerId;
  }
  if (voiceId) {
    voiceSettings.voiceId = voiceId;
  }

  return voiceSettings;
}

export function normalizeExperienceLevel(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("lead")) {
    return "lead";
  }
  if (normalized.includes("senior")) {
    return "senior";
  }
  if (normalized.includes("entry") || normalized.includes("junior")) {
    return "entry";
  }
  if (normalized.includes("mid")) {
    return "mid";
  }
  return INTERVIEW_DEFAULT_EXPERIENCE_LEVEL;
}

export function normalizeConfig(raw: InterviewConfigInput): InterviewConfig {
  const questionCount = parseNumber(
    raw.questionCount,
    INTERVIEW_DEFAULT_QUESTION_COUNT,
    1,
    INTERVIEW_SERVICE_MAX_QUESTION_COUNT,
  );
  const duration = parseNumber(raw.duration, INTERVIEW_DEFAULT_DURATION_MINUTES, 5, 120);
  const experienceLevel = normalizeExperienceLevel(
    parseString(raw.experienceLevel, INTERVIEW_DEFAULT_EXPERIENCE_LEVEL),
  );
  const interviewMode = normalizeInterviewMode(raw.interviewMode);
  const targetJob = normalizeInterviewTargetJob(raw.targetJob);
  const roleType = parseString(raw.roleType, targetJob?.title || INTERVIEW_DEFAULT_ROLE_TYPE);
  const roleCategory = parseString(raw.roleCategory, INTERVIEW_DEFAULT_ROLE_CATEGORY);
  const includeTechnical = parseBoolean(raw.includeTechnical, true);
  const includeBehavioral = parseBoolean(raw.includeBehavioral, true);
  const includeStudioSpecific = parseBoolean(raw.includeStudioSpecific, true);
  const focusAreas = parseStringArray(raw.focusAreas);
  const technologies = parseStringArray(raw.technologies);
  const enableVoiceMode = parseBoolean(raw.enableVoiceMode, false);
  const voiceSettings = normalizeVoiceSettings(raw.voiceSettings);
  const candidateContext = normalizeCandidateContext(raw.candidateContext);
  const conversationStyle = normalizeConversationStyle(raw.conversationStyle);

  return {
    roleType,
    roleCategory,
    experienceLevel,
    focusAreas: focusAreas.length > 0 ? focusAreas : [...INTERVIEW_DEFAULT_FOCUS_AREAS],
    duration,
    questionCount,
    includeTechnical,
    includeBehavioral,
    includeStudioSpecific,
    enableVoiceMode,
    technologies,
    voiceSettings,
    interviewMode,
    conversationStyle,
    targetJob,
    candidateContext,
  };
}
