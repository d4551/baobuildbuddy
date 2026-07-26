const interviewScoreCard = {
  interviewScoreCard: {
    title: "Analyse des performances d'entretien",
    description:
      "Évaluation de la session agrégée à partir de chaque question répondue, avec sa source.",
    progressAria: "Score global d'entretien {score} pour cent",
    overallScore: "Score global",
    strengths: "Points forts",
    areasForImprovement: "Axes d'amélioration",
    recommendations: "Recommandations",
    emptyList: "Rien n'a été enregistré dans cette section.",
    provenance: {
      label: "Source de l'évaluation",
      ai: "Évalué par IA",
      heuristic: "Repli heuristique",
      mixed: "Mélange IA et heuristique",
      unknown: "Source non enregistrée",
      aiAverage: "Moyenne notée par IA {score} %",
      counts: "{ai} IA · {heuristic} heuristique · {unattributed} non attribué",
    },
  },
} as const;

export default interviewScoreCard;
