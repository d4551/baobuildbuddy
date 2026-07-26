/**
 * Mock interview system types
 */

import type { ScrapePersonaEnrichment } from "./jobs";

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
  enrichment?: ScrapePersonaEnrichment;
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
  interviewMode?: InterviewMode;
  conversationStyle?: InterviewConversationStyle;
  targetJob?: InterviewTargetJob;
  candidateContext?: InterviewCandidateContext;
}

export interface InterviewQuestion {
  id: string;
  type: "behavioral" | "technical" | "studio-specific" | "intro" | "closing";
  question: string;
  followUps: string[];
  expectedDuration: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  score?: number;
  feedback?: string;
  response?: string;
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
  role?: string;
  studioName?: string;
  score?: number;
  duration?: string;
  overallFeedback?: string;
  totalResponses?: number;
  createdAt?: string;
  updatedAt?: string;
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
    source: InterviewAnalysisSource;
    provider?: string;
    model?: string;
  };
}

/**
 * Provenance of a single response analysis. Legacy rows without a stored
 * source are normalized to "unknown" at read time.
 */
export type InterviewAnalysisSource = "ai" | "heuristic" | "unknown";

/**
 * Aggregated provenance for a session-level final analysis.
 */
export type InterviewAnalysisAggregateSource = "ai" | "heuristic" | "mixed" | "unknown";

/**
 * Per-source response analysis counts within a session or stats aggregate.
 */
export interface InterviewAnalysisProvenanceCounts {
  ai: number;
  heuristic: number;
  unknown: number;
}

export interface InterviewAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  feedback?: string;
  analysisSource?: InterviewAnalysisAggregateSource;
  aiAverageScore?: number | null;
  provenanceCounts?: InterviewAnalysisProvenanceCounts;
}

export interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  strongestAreas: string[];
  improvementAreas: string[];
  totalTimeSpent: number;
  favoriteStudios: string[];
  analysisSource?: InterviewAnalysisAggregateSource;
  aiAverageScore?: number | null;
  provenanceCounts?: InterviewAnalysisProvenanceCounts;
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

/**
 * Interview setup mode.
 */
export type InterviewMode = "studio" | "job";

/**
 * Interview pacing mode.
 */
export type InterviewConversationStyle = "natural" | "structured";

/**
 * Candidate artifacts used to ground interview questions and scoring.
 */
export interface InterviewCandidateContext {
  resumeId?: string;
  coverLetterId?: string;
  portfolioId?: string;
}

/**
 * Job context passed into an interview session.
 */
export interface InterviewTargetJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  requirements?: string[];
  technologies?: string[];
  source?: string;
  postedDate?: string;
  url?: string;
  enrichment?: ScrapePersonaEnrichment;
}
