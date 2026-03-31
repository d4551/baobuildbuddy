const catalog = {
  interviewHub: {
    seoTitle: "Centre de préparation aux entretiens",
    seoDescription:
      "Entraînez-vous avec des scénarios d'entretien orientés poste ou studio, puis révisez les retours notés.",
    title: "Centre de préparation aux entretiens",
    config: {
      conversationStyleLegend: "Style de conversation",
      conversationStyleAria: "Style de conversation",
      conversationStyleNatural: "Conversation naturelle",
      conversationStyleStructured: "Rounds structurés",
      conversationStyleHint:
        "Le mode naturel génère une question contextualisée à la fois. Le mode structuré prépare l'ensemble de la session dès le départ.",
    },
    errors: {
      bootstrapLoadFailed: "Impossible de charger les données du centre d'entretien",
      roleRecommendationsFailed: "Impossible de charger les recommandations de rôle personnalisées",
    },
  },
} as const;

export default catalog;
