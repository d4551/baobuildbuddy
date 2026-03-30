import type { InterviewAnalysis, InterviewConfig, InterviewConversationStyle, InterviewResponse, ScrapePersonaEnrichment, VoiceSettings } from "@bao/shared";
import type { interviewSessions } from "../db/schema/interviews";
export type DBInterviewSession = typeof interviewSessions.$inferSelect;
export type InterviewConfigInput = Record<string, unknown>;
export type JsonRecord = Record<string, unknown>;
export interface StudioContext {
    id: string;
    name: string;
    description: string;
    interviewStyle: string;
    technologies: string[];
    games: string[];
    culture: Record<string, unknown>;
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
export type NormalizeVoiceSettings = (raw: unknown) => VoiceSettings | undefined;
export type NormalizeConfig = (raw: InterviewConfigInput) => InterviewConfig;
export type NormalizeQuestionFeedback = (raw: unknown) => NonNullable<InterviewResponse["aiAnalysis"]> | null;
export type NormalizeFinalAnalysis = (raw: unknown) => InterviewAnalysis | null;
