const catalog = {
  interviewHistory: {
    title: "Historique des entretiens",
    subtitle:
      "Revoyez les sessions précédentes, comparez les scores dans le temps et rouvrez le retour complet de chaque entretien.",
    emptyStateTitle: "Aucune session d'entretien trouvée",
    emptyStateDescription:
      "Démarrez un nouvel entretien depuis une offre récupérée ou un exercice studio pour alimenter l'historique.",
    retryButtonLabel: "Réessayer",
    retryAria: "Réessayer le chargement des détails de l'entretien",
    selectPromptTitle: "Choisissez une session",
    selectPromptDescription:
      "Ouvrez n'importe quelle session de la liste pour revoir les scores, réponses et retours IA.",
    timelineScoreAria: "Score d'entretien : {score} pour cent",
    detailScoreAria: "Score d'entretien : {score} pour cent",
  },
} as const;

export default catalog;
