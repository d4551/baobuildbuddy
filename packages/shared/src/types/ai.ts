/**
 * AI provider and multi-modal types
 */

export const AI_PROVIDER_IDS = ["gemini", "claude", "openai", "huggingface", "local"] as const;

export type AIProviderType = (typeof AI_PROVIDER_IDS)[number];

/**
 * Canonical AI routing purposes used to select provider/model pairs by capability.
 */
export const AI_ROUTING_PURPOSE_IDS = [
  "chat",
  "interviewQuestions",
  "interviewFeedback",
  "resume",
  "coverLetter",
  "emailResponse",
  "jobMatch",
  "scrapeEnrichment",
  "automationFieldMapping",
] as const;

/**
 * Explicit AI routing purpose identifier.
 */
export type AIRoutingPurpose = (typeof AI_ROUTING_PURPOSE_IDS)[number];

/**
 * Provider/model pair used for one AI routing purpose.
 */
export interface AIRoutingTarget {
  provider: AIProviderType;
  model?: string;
}

/**
 * Complete AI routing table persisted in settings and consumed by the server.
 */
export type AIRouting = Record<AIRoutingPurpose, AIRoutingTarget>;

/**
 * Structured diagnostic state for one provider readiness check.
 */
export interface AIProviderDiagnostic {
  provider: AIProviderType;
  code:
    | "healthy"
    | "unconfigured"
    | "unreachable"
    | "empty-model-list"
    | "invalid-model"
    | "timeout"
    | "error";
  checkedAt: string;
  endpoint?: string;
  selectedModel?: string;
  availableModels?: readonly string[];
  message?: string;
}

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
}

export interface AIResponse {
  id: string;
  provider: AIProviderType;
  model: string;
  content: string;
  usage?: UsageMetrics;
  timing?: TimingMetrics;
  error?: string;
}

export interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  cost?: number;
}

export interface TimingMetrics {
  startedAt: number;
  completedAt: number;
  totalTime: number;
}

export interface GenerateOptions {
  purpose?: AIRoutingPurpose;
  provider?: AIProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  timeout?: number;
  systemPrompt?: string;
  messages?: ChatMessage[];
}

export interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (result: AIResponse) => void;
  onError?: (error: Error) => void;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  id?: string;
  content: string;
  timestamp?: string;
  sessionId?: string;
}

export interface AIProviderStatus {
  provider: AIProviderType;
  available: boolean;
  health: "healthy" | "degraded" | "down" | "unconfigured";
  lastCheck?: number;
  error?: string;
  endpoint?: string;
  selectedModel?: string;
  availableModels?: readonly string[];
  diagnosticCode?: AIProviderDiagnostic["code"];
}

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProviderType;
  capabilities: string[];
  contextWindow?: number;
  maxTokens?: number;
}

/**
 * Supported context domains for AI chat.
 */
export const AI_CHAT_CONTEXT_DOMAIN_IDS = [
  "resume",
  "job_search",
  "interview",
  "portfolio",
  "skills",
  "automation",
  "general",
] as const;

/**
 * AI chat context domain identifier.
 */
export type AIChatContextDomain = (typeof AI_CHAT_CONTEXT_DOMAIN_IDS)[number];

/**
 * Supported context sources for AI chat messages.
 */
export const AI_CHAT_CONTEXT_SOURCE_IDS = ["floating-widget", "chat-page"] as const;

/**
 * AI chat context source identifier.
 */
export type AIChatContextSource = (typeof AI_CHAT_CONTEXT_SOURCE_IDS)[number];

/**
 * Deterministic AI chat UI flow states used across chat surfaces.
 */
export const AI_CHAT_FLOW_STATES = [
  "idle",
  "loading",
  "success",
  "empty",
  "error-retryable",
  "error-non-retryable",
  "unauthorized",
] as const;

/**
 * AI chat UI flow state union.
 */
export type AIChatFlowState = (typeof AI_CHAT_FLOW_STATES)[number];

/**
 * Entity types that can be attached to AI chat context.
 */
export const AI_CHAT_CONTEXT_ENTITY_TYPE_IDS = [
  "job",
  "resume",
  "studio",
  "interview_session",
  "automation_run",
] as const;

/**
 * AI chat context entity identifier.
 */
export type AIChatContextEntityType = (typeof AI_CHAT_CONTEXT_ENTITY_TYPE_IDS)[number];

/**
 * Route snapshot attached to AI chat context payload.
 */
export interface AIChatContextRoute {
  path: string;
  name?: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Focused entity that the user is viewing when sending a message.
 */
export interface AIChatContextEntity {
  type: AIChatContextEntityType;
  id: string;
  label?: string;
}

/**
 * Lightweight application state indicators included with AI chat context.
 */
export interface AIChatContextState {
  hasResumes: boolean;
  resumeCount: number;
  hasJobs: boolean;
  jobCount: number;
  hasStudios: boolean;
  studioCount: number;
  hasInterviewSessions: boolean;
  interviewSessionCount: number;
  hasPortfolioProjects: boolean;
  portfolioProjectCount: number;
}

/**
 * Typed contextual payload sent alongside AI chat messages.
 */
export interface AIChatContext {
  source: AIChatContextSource;
  domain?: AIChatContextDomain;
  route: AIChatContextRoute;
  entity?: AIChatContextEntity;
  state: AIChatContextState;
}
