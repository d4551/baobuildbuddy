const aiProviderCatalog = {
  aiProviderCatalog: {
    local: {
      name: "Local Model",
      description: "RamaLama or Ollama with private, local-first execution.",
    },
    gemini: {
      name: "Google Gemini",
      description: "Primary cloud provider for general QA and content generation.",
    },
    claude: {
      name: "Anthropic Claude",
      description: "Long-context reasoning provider for analysis-heavy workflows.",
    },
    openai: {
      name: "OpenAI",
      description: "GPT model family for broad chat and generation tasks.",
    },
    huggingface: {
      name: "Hugging Face",
      description: "Cloud fallback with a broad open-model catalog.",
    },
  },
} as const;

export default aiProviderCatalog;
