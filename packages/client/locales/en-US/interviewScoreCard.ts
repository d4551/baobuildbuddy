const interviewScoreCard = {
  interviewScoreCard: {
    title: "Interview Performance Analysis",
    description:
      "Session-level assessment aggregated from every answered question, with the source that produced it.",
    progressAria: "Overall interview score {score} percent",
    overallScore: "Overall Score",
    strengths: "Strengths",
    areasForImprovement: "Areas for Improvement",
    recommendations: "Recommendations",
    emptyList: "Nothing recorded for this section.",
    provenance: {
      label: "Assessment source",
      ai: "AI assessed",
      heuristic: "Heuristic fallback",
      mixed: "Mixed AI and heuristic",
      unknown: "Source not recorded",
      modelAttribution: "{provider} · {model}",
      aiAverage: "AI-scored average {score}%",
      counts: "{ai} AI · {heuristic} heuristic · {unattributed} unattributed",
    },
  },
} as const;

export default interviewScoreCard;
