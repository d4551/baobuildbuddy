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
export { ClaudeProvider } from "./claude-provider";
export { GeminiProvider } from "./gemini-provider";
export { HuggingFaceProvider } from "./huggingface-provider";
export { LocalProvider } from "./local-provider";
export { OpenAIProvider } from "./openai-provider";
export { careerTransitionPrompt, companyResearchPrompt, coverLetterCustomizePrompt, coverLetterPrompt, cvQuestionnaireQuestionsPrompt, cvQuestionnaireSynthesizePrompt, DOMAIN_SYSTEM_PROMPTS, emailResponsePrompt, formFieldAnalysisPrompt, GAMING_INDUSTRY_CONTEXT, interviewFeedbackPrompt, interviewFollowUpPrompt, interviewPersonaPrompt, interviewQuestionPrompt, jobMatchPrompt, portfolioDescriptionPrompt, portfolioReviewPrompt, resumeEnhancePrompt, resumeQuantifyPrompt, resumeScorePrompt, salaryNegotiationPrompt, skillAnalysisPrompt, skillCategorizePrompt, skillGapPrompt, SYSTEM_PROMPT } from "./prompts";
export type { AIProvider } from "./provider-interface";
export { BaseAIProvider } from "./provider-interface";
