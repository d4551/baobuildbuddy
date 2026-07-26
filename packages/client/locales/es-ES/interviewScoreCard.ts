const interviewScoreCard = {
  interviewScoreCard: {
    title: "Análisis de rendimiento en entrevista",
    description:
      "Evaluación de la sesión agregada de cada pregunta respondida, con la fuente que la produjo.",
    progressAria: "Puntuación general de entrevista {score} por ciento",
    overallScore: "Puntuación General",
    strengths: "Fortalezas",
    areasForImprovement: "Áreas de Mejora",
    recommendations: "Recomendaciones",
    emptyList: "No hay nada registrado en esta sección.",
    provenance: {
      label: "Fuente de la evaluación",
      ai: "Evaluado por IA",
      heuristic: "Alternativa heurística",
      mixed: "Mezcla de IA y heurística",
      unknown: "Fuente no registrada",
      aiAverage: "Media puntuada por IA {score}%",
      counts: "{ai} IA · {heuristic} heurística · {unattributed} sin atribuir",
    },
  },
} as const;

export default interviewScoreCard;
