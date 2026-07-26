const studiosIndex = {
  studiosIndex: {
    seoTitle: "スタジオディレクトリ",
    seoDescription:
      "スタジオプロフィールを検索し、運用属性で絞り込み、文脈付きの面接練習を開始できます。",
    title: "スタジオディレクトリ",
    subtitle: "スタジオプロフィールを確認し、運用属性で絞り込み、そのまま面接練習に進めます。",
    errorTitle: "スタジオディレクトリを利用できません",
    retryAria: "スタジオ読み込みを再試行",
    retryButton: "再試行",
    emptyTitle: "この条件に一致するスタジオがありません",
    emptyDescription:
      "現在の検索条件またはフィルターの組み合わせを調整して、別のスタジオプロフィールを表示してください。",
    options: {
      type: {
        indie: "インディー",
        mobile: "モバイル",
        platform: "プラットフォーム",
        esports: "eスポーツ",
        general: "汎用",
        publisher: "パブリッシャー",
        services: "サービス",
        aiTech: "AI/テック",
        midSize: "中規模",
        unknown: "不明",
      },
      size: {
        range50To199: "50〜199名",
        range200To999: "200〜999名",
        range500Plus: "500名以上",
        range1000Plus: "1000名以上",
        notAvailable: "該当なし",
      },
    },
  },
} as const;

export default studiosIndex;
