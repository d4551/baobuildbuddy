import type { AIProviderType } from "../types/ai";

/**
 * Default local provider endpoints and model settings.
 */
export const LOCAL_AI_DEFAULT_ENDPOINT = "http://localhost:8080/v1";
export const OLLAMA_AI_DEFAULT_ENDPOINT = "http://localhost:11434/v1";
export const LOCAL_AI_DEFAULT_MODEL = "llama3.2";

export const LOCAL_AI_RECOMMENDED_MODELS = ["llama3.2", "granite-code", "mistral"] as const;

export type LocalModelName = (typeof LOCAL_AI_RECOMMENDED_MODELS)[number];

export type LocalProviderServer = {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
};

export const LOCAL_AI_SERVERS: readonly LocalProviderServer[] = [
  { id: "ramalama", name: "RamaLama", baseUrl: LOCAL_AI_DEFAULT_ENDPOINT },
  { id: "ollama", name: "Ollama", baseUrl: OLLAMA_AI_DEFAULT_ENDPOINT },
] as const;

export type AIProviderMetadata = {
  id: AIProviderType;
  name: string;
  description: string;
  icon: string;
  modelHints: readonly string[];
  requiresCredential: boolean;
};

export const AI_PROVIDER_CATALOG: readonly AIProviderMetadata[] = [
  {
    id: "local",
    name: "Local Model",
    description: "RamaLama / Ollama — private, local-first execution.",
    icon: "💻",
    modelHints: [...LOCAL_AI_RECOMMENDED_MODELS],
    requiresCredential: false,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Primary cloud provider for general QA and generation.",
    icon: "✨",
    modelHints: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
    requiresCredential: true,
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    description: "Strong reasoning and long-context analysis.",
    icon: "🧠",
    modelHints: ["claude-sonnet-4-5-20250929", "claude-3-5-sonnet-20241022", "claude-3-opus"],
    requiresCredential: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT model family for flexible responses.",
    icon: "🤖",
    modelHints: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    requiresCredential: true,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    description: "Cloud fallback with a mostly free starter path.",
    icon: "🤗",
    modelHints: ["Qwen/Qwen2.5-Coder-32B-Instruct", "meta-llama/Llama-3.3-70B-Instruct"],
    requiresCredential: false,
  },
];

export const AI_PROVIDER_DEFAULT_ORDER: readonly AIProviderType[] = [
  "local",
  "gemini",
  "claude",
  "openai",
  "huggingface",
];
