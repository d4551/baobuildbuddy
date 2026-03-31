import type {
  InterviewConversationStyle,
  InterviewMode,
  VoiceSettings,
} from "@bao/shared/types/interview";

export interface InterviewHubSessionConfig {
  studioId: string;
  role: string;
  experienceLevel: string;
  questionCount: number;
  conversationStyle: InterviewConversationStyle;
  enableVoiceMode: boolean;
  voiceSettings: VoiceSettings;
}

export interface RecentInterviewSession {
  id: string;
  studioName?: string | null;
  studioId?: string | null;
  role?: string | null;
  score?: number | null;
  createdAt?: string;
  config: {
    roleType: string;
    interviewMode?: InterviewMode;
  };
}

export interface StudioSelectorOption {
  id: string;
  name: string;
  type: string;
  location: string;
}
