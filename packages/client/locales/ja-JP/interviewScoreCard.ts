const interviewScoreCard = {
  interviewScoreCard: {
    title: "面接パフォーマンス分析",
    description: "回答済みの全質問を集約したセッション評価と、その生成元を表示します。",
    progressAria: "面接の総合スコア {score} パーセント",
    overallScore: "総合スコア",
    strengths: "強み",
    areasForImprovement: "改善点",
    recommendations: "推奨事項",
    emptyList: "このセクションに記録はありません。",
    provenance: {
      label: "評価の生成元",
      ai: "AI による評価",
      heuristic: "ヒューリスティック代替",
      mixed: "AI とヒューリスティックの混在",
      unknown: "生成元は未記録",
      aiAverage: "AI 採点の平均 {score}%",
      counts: "AI {ai} 件 · ヒューリスティック {heuristic} 件 · 未帰属 {unattributed} 件",
    },
  },
} as const;

export default interviewScoreCard;
