import type { InterviewCandidateContext, InterviewConfig, InterviewConversationStyle, InterviewMode, InterviewTargetJob, VoiceSettings } from "@bao/shared/types/interview";
import type { InterviewConfigInput } from "./interview-service-contracts";
export declare function normalizeInterviewMode(value: unknown): InterviewMode;
export declare function normalizeConversationStyle(value: unknown): InterviewConversationStyle;
export declare function normalizeCandidateContext(value: unknown): InterviewCandidateContext | undefined;
export declare function normalizeInterviewTargetJob(value: unknown): InterviewTargetJob | undefined;
export declare function normalizeVoiceSettings(raw: unknown): VoiceSettings | undefined;
export declare function normalizeInterviewExperienceLevel(value: string): string;
export declare function normalizeConfig(raw: InterviewConfigInput): InterviewConfig;
