const aiProviderCatalog = {
  aiProviderCatalog: {
    local: {
      name: "ローカルモデル",
      description: "RamaLama または Ollama を使ったプライベートなローカル優先実行。",
    },
    gemini: {
      description: "一般的なQAとコンテンツ生成に適した主要クラウドプロバイダー。",
    },
    claude: {
      description: "長文脈推論が必要な分析系ワークフロー向けプロバイダー。",
    },
    openai: {
      description: "幅広いチャットと生成タスクに対応するGPTモデルファミリー。",
    },
    huggingface: {
      description: "幅広いオープンモデルを提供するクラウドのフォールバック先。",
    },
  },
} as const;

export default aiProviderCatalog;
