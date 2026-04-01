const catalog = {
  interviewHub: {
    seoTitle: "面接準備ハブ",
    seoDescription:
      "求人ベースとスタジオベースの面接フローで練習し、スコア付きフィードバックで改善点を確認できます。",
    title: "面接準備ハブ",
    config: {
      conversationStyleLegend: "会話スタイル",
      conversationStyleAria: "会話スタイル",
      conversationStyleNatural: "自然な会話",
      conversationStyleStructured: "構造化ラウンド",
      conversationStyleHint:
        "自然モードでは文脈に沿った質問を1つずつ生成します。構造化モードでは面接全体の質問セットを先に作成します。",
    },
    errors: {
      bootstrapLoadFailed: "面接ハブのデータ読み込みに失敗しました",
      roleRecommendationsFailed: "最適化されたロール提案の読み込みに失敗しました",
    },
  },
} as const;

export default catalog;
