const catalog = {
  aiProviderCatalog: {
    local: {
      name: "Modèle local",
      description: "RamaLama ou Ollama avec une exécution privée, locale d'abord.",
    },
    gemini: {
      description: "Fournisseur cloud principal pour QA générale et génération de contenu.",
    },
    claude: {
      description: "Fournisseur à long contexte pour les workflows d'analyse approfondie.",
    },
    openai: {
      description: "Famille GPT pour le chat et la génération polyvalente.",
    },
    huggingface: {
      description: "Solution cloud de secours avec un large catalogue de modèles ouverts.",
    },
  },
} as const;

export default catalog;
