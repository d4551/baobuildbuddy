const aiProviderCatalog = {
  aiProviderCatalog: {
    local: {
      name: "Modelo local",
      description: "RamaLama u Ollama con ejecución privada y local primero.",
    },
    gemini: {
      description: "Proveedor cloud principal para QA general y generación de contenido.",
    },
    claude: {
      description: "Proveedor de razonamiento de largo contexto para flujos analíticos.",
    },
    openai: {
      description: "Familia GPT para chat y generación en flujos generales.",
    },
    huggingface: {
      description: "Respaldo cloud con un catálogo amplio de modelos abiertos.",
    },
  },
} as const;

export default aiProviderCatalog;
