/**
 * Mock interview system types
 */

export interface GameStudio {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  location: string;
  size: string;
  type: string;
  founded?: number;
  description?: string;
  games: string[];
  technologies: string[];
  culture: StudioCulture;
  commonRoles?: string[];
  interviewStyle?: string;
  remoteWork?: boolean;
  category?: "AAA" | "Indie" | "Mobile" | "VR/AR" | "Platform" | "Esports" | "International";
  region?: string;
  benefits?: string[];
}

export interface StudioCulture {
  values: string[];
  workStyle: string;
  environment?: string;
}

export interface InterviewConfig {
  roleType: string;
  roleCategory?: string;
  experienceLevel: string;
  focusAreas: string[];
  duration: number;
  questionCount: number;
  includeTechnical: boolean;
  includeBehavioral: boolean;
  includeStudioSpecific: boolean;
  enableVoiceMode?: boolean;
  technologies?: string[];
  voiceSettings?: VoiceSettings;
}

export interface InterviewQuestion {
  id: string;
  type: "behavioral" | "technical" | "studio-specific" | "intro" | "closing";
  question: string;
  followUps: string[];
  expectedDuration: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface InterviewerPersona {
  name: string;
  role: string;
  studioName: string;
  background: string;
  style: string;
  experience: string;
}

export interface InterviewSession {
  id: string;
  studioId: string;
  config: InterviewConfig;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  totalQuestions: number;
  startTime: number;
  endTime?: number;
  status: "preparing" | "active" | "paused" | "completed" | "cancelled";
  responses: InterviewResponse[];
  finalAnalysis?: InterviewAnalysis;
  interviewerPersona?: InterviewerPersona;
}

export interface InterviewResponse {
  questionId: string;
  transcript: string;
  duration: number;
  timestamp: number;
  confidence: number;
  aiAnalysis?: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
}

export interface InterviewAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  feedback?: string;
}

export interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  strongestAreas: string[];
  improvementAreas: string[];
  totalTimeSpent: number;
  favoriteStudios: string[];
}

export interface VoiceSettings {
  microphoneId?: string;
  speakerId?: string;
  voiceId?: string;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
}
