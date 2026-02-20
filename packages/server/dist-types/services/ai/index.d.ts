/**
 * AI Service Layer - Multi-provider AI orchestration
 *
 * This module provides a comprehensive AI service layer supporting multiple providers:
 * - Google Gemini
 * - Anthropic Claude
 * - OpenAI GPT
 * - Hugging Face (free tier)
 * - Local providers (RamaLama, Ollama)
 *
 * Features:
 * - Automatic fallback between providers
 * - Streaming support
 * - Provider health monitoring
 * - Local provider detection
 * - Specialized prompts for career assistance
 */
export { AIService } from "./ai-service";
export { GeminiProvider } from "./gemini-provider";
export { ClaudeProvider } from "./claude-provider";
export { OpenAIProvider } from "./openai-provider";
export { HuggingFaceProvider } from "./huggingface-provider";
export { LocalProvider } from "./local-provider";
export type { AIProvider } from "./provider-interface";
export { BaseAIProvider } from "./provider-interface";
export * from "./prompts";
