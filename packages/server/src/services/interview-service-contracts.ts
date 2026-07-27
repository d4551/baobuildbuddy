import type {
  InterviewAnalysis,
  InterviewConfig,
  InterviewConversationStyle,
  InterviewResponse,
  VoiceSettings,
} from "@bao/shared/types/interview";
import type { ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import type { interviewSessions } from "../db/schema/interviews";

export type DBInterviewSession = typeof interviewSessions.$inferSelect;

/**
 * Config input accepted by normalizeConfig. Values are narrowed by generic
 * parsers internally, so the record accepts JSON values, typed objects
 * (InterviewTargetJob, VoiceSettings, etc.), null, or undefined.
 */
export type InterviewConfigInput = Readonly<Record<string, JsonValue | object | null | undefined>>;
export type JsonRecord = JsonObject;

export interface StudioContext {
  id: string;
  name: string;
  description: string;
  interviewStyle: string;
  technologies: string[];
  games: string[];
  culture: JsonObject;
  location: string;
  type: string;
  remoteWork: boolean;
  enrichment?: ScrapePersonaEnrichment;
}

export interface CandidateInterviewContext {
  conversationStyle: InterviewConversationStyle;
  profileSummary: string;
  resumeSummary: string;
  coverLetterSummary: string;
  portfolioSummary: string;
}

export interface FinalAnalysisPromptContext {
  studio: StudioContext;
  config: InterviewConfig;
  responses: InterviewResponse[];
  persona: {
    name: string;
    role: string;
    studioName: string;
    background: string;
    style: string;
    experience: string;
  };
  candidateContext: CandidateInterviewContext;
}

export type FallbackInterviewContext = {
  interviewEntity: string;
  roleTarget: string;
  primaryTechnology: string;
  experienceHighlight: string;
  projectHighlight: string;
  focusArea: string;
  hiringSignal: string;
  pitchAngle: string;
};

export type NormalizeVoiceSettings = <T>(raw: T) => VoiceSettings | undefined;
export type NormalizeConfig = (raw: InterviewConfigInput) => InterviewConfig;
export type NormalizeQuestionFeedback = <T>(
  raw: T,
) => NonNullable<InterviewResponse["aiAnalysis"]> | null;
export type NormalizeFinalAnalysis = <T>(raw: T) => InterviewAnalysis | null;
