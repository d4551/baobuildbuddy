import type { InterviewCandidateContext, InterviewConfig, InterviewConversationStyle, InterviewMode, InterviewTargetJob, VoiceSettings } from "@bao/shared/types/interview";
import type { InterviewConfigInput } from "./interview-service-contracts";
export declare function normalizeInterviewMode<T>(value: T): InterviewMode;
export declare function normalizeConversationStyle<T>(value: T): InterviewConversationStyle;
export declare function normalizeCandidateContext<T>(value: T): InterviewCandidateContext | undefined;
export declare function normalizeInterviewTargetJob<T>(value: T): InterviewTargetJob | undefined;
export declare function normalizeVoiceSettings<T>(raw: T): VoiceSettings | undefined;
export declare function normalizeInterviewExperienceLevel(value: string): string;
export declare function normalizeConfig(raw: InterviewConfigInput): InterviewConfig;
