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
