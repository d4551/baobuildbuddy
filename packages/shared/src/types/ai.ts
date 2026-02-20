/**
 * AI provider and multi-modal types
 */

export const AI_PROVIDER_IDS = ["gemini", "claude", "openai", "huggingface", "local"] as const;

export type AIProviderType = (typeof AI_PROVIDER_IDS)[number];

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
  hasJobs: boolean;
  hasStudios: boolean;
  hasInterviewSessions: boolean;
  hasPortfolioProjects: boolean;
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
