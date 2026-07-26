const jobsPage = {
  jobsPage: {
    seoTitle: "求人ボード",
    seoDescription:
      "プラットフォーム、スタジオ種別、ジャンル、経験レベルでゲーム業界の求人を検索・絞り込みできます。",
    title: "求人ボード",
    emptyStateTitle: "フィルターに一致する求人がありません",
    emptyStateDescription:
      "現在の求人ビューを広げるために、検索条件またはフィルターを調整してください。",
    options: {
      all: "すべて",
      allTypes: "すべての種別",
      allPlatforms: "すべてのプラットフォーム",
      allGenres: "すべてのジャンル",
      experience: {
        entry: "初級",
        junior: "ジュニア",
        mid: "中級",
        senior: "シニア",
        principal: "プリンシパル",
        director: "ディレクター",
      },
      platform: {
        console: "コンソール",
        mobile: "モバイル",
      },
      genre: {
        action: "アクション",
        strategy: "ストラテジー",
        puzzle: "パズル",
        simulation: "シミュレーション",
        sports: "スポーツ",
        racing: "レース",
        shooter: "シューター",
        platformer: "プラットフォーマー",
        horror: "ホラー",
        battleRoyale: "バトルロイヤル",
        roguelike: "ローグライク",
        sandbox: "サンドボックス",
        adventure: "アドベンチャー",
        fighting: "格闘",
        survival: "サバイバル",
        cardGame: "カードゲーム",
        casual: "カジュアル",
        indie: "インディー",
      },
    },
    pagination: {
      navigationAria: "求人ページネーション",
      previousAria: "前の求人ページ",
      nextAria: "次の求人ページ",
      pageAria: "求人ページ {page} へ移動",
      summary: "{total} 件中 {start}-{end} 件を表示",
    },
  },
} as const;

export default jobsPage;
