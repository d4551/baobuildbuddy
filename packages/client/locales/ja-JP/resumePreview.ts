const resumePreview = {
  resumePreview: {
    pageTitle: "履歴書プレビュー",
    description: "エクスポートや共有の前に、印刷用の履歴書レイアウトを確認します。",
    printButton: "印刷",
    printAria: "履歴書プレビューを印刷",
    retryButton: "再試行",
    retryAria: "履歴書プレビューの読み込みを再試行",
    loadError: "履歴書プレビューの読み込みに失敗しました。",
    notFoundTitle: "履歴書が見つかりません",
    notFoundDescription:
      "このプレビューを開くには、履歴書ワークスペースから保存済みの履歴書を選択してください。",
    websiteLinkAria: "個人ウェブサイトを開く",
    linkedinLinkAria: "LinkedInプロフィールを開く",
    githubLinkAria: ["Git", "Hubプロフィールを開く"].join(""),
  },
} as const;

export default resumePreview;
