const catalog = {
  portfolioPage: {
    title: "ポートフォリオビルダー",
    bootstrap: {
      loadError: "ポートフォリオデータの読み込みに失敗しました。",
      retryButton: "再試行",
      retryAria: "ポートフォリオデータの読み込みを再試行",
    },
    emptyState: {
      title: "ポートフォリオの準備ができました",
      description:
        "まずプロフィール情報を入力し、その後1件以上のプロジェクトを追加して公開ポートフォリオを形にしてください。",
      profileButton: "プロフィールを編集",
    },
    preview: {
      pageTitle: "ポートフォリオプレビュー",
      description: "エクスポートや共有の前に、公開状態のポートフォリオ表示を確認します。",
      backButton: "ビルダーに戻る",
      backButtonAria: "ポートフォリオビルダーに戻る",
      exportPdfButton: "PDFをエクスポート",
      exportPdfAria: "ポートフォリオプレビューをPDFでエクスポート",
      retryButton: "再試行",
      retryAria: "ポートフォリオプレビューの読み込みを再試行",
      loadError: "ポートフォリオプレビューの読み込みに失敗しました。",
      defaultTitle: "私のポートフォリオ",
      contactButton: "連絡する",
      contactAria: "メールでポートフォリオ所有者に連絡する",
      websiteButton: "ウェブサイトを見る",
      websiteAria: "ポートフォリオのウェブサイトを開く",
      featuredProjectsTitle: "注目プロジェクト",
      moreProjectsTitle: "その他のプロジェクト",
      viewButton: "表示",
      emptyStateTitle: "表示できるプロジェクトがありません",
      emptyStateDescription:
        "ポートフォリオビルダーでプロジェクトを追加して、このプレビューに掲載してください。",
      notFoundTitle: "ポートフォリオが見つかりません",
      notFoundDescription: "先にポートフォリオを作成してから、このプレビューに戻ってください。",
    },
  },
} as const;

export default catalog;
