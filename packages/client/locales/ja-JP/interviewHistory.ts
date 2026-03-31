const catalog = {
  interviewHistory: {
    title: "面接履歴",
    subtitle:
      "過去の面接実行を確認し、スコア推移を比較しながら、各セッションの完全なフィードバックを再表示できます。",
    emptyStateTitle: "面接セッションが見つかりません",
    emptyStateDescription:
      "スクレイプした求人またはスタジオ練習から新しい面接を開始して履歴を作成してください。",
    retryButtonLabel: "再試行",
    retryAria: "面接セッション詳細の読み込みを再試行",
    selectPromptTitle: "セッションを選択",
    selectPromptDescription:
      "一覧から任意のセッションを開いて、スコア、回答、AIフィードバックを確認してください。",
    timelineScoreAria: "面接スコア: {score} パーセント",
    detailScoreAria: "面接スコア: {score} パーセント",
  },
} as const;

export default catalog;
