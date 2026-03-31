const catalog = {
  gamificationPage: {
    pageTitle: "Centro de Gamificación",
    metricsSummary: "Motor de progresión y desafíos de {brand}",
    seoTitle: "Centro de Gamificación de {brand}",
    seoDescription:
      "Seguimiento de progresión XP, completar desafíos diarios, rachas y desbloqueo de logros en una sola vista.",
    loadErrorFallback: "Error al cargar datos de gamificación",
    retryButtonLabel: "Reintentar",
    retryAria: "Reintentar carga de datos de gamificación",
    emptyStateTitle: "Sin datos de progresión aún",
    emptyStateDescription:
      "Completa tareas de configuración, inicia la práctica de entrevistas y realiza desafíos diarios para ganar XP y desbloquear logros.",
    emptyStateCta: "Abrir Panel",
    levelPrefix: "Nivel",
    xpUntilLevelLabel: "XP hasta el nivel",
    currentStreakTitle: "Racha Actual",
    longestStreakTitle: "Racha Más Larga",
    achievementsTitle: "Logros",
    achievementsUnlockedLabel: "Desbloqueados",
    achievementsLockedLabel: "Bloqueados",
    dailyChallengesTitle: "Desafíos Diarios",
    challengeClaimLabel: "Reclamar Recompensa",
    challengeClaimAria: "Reclamar recompensa para el desafío {challenge}",
    challengeDoneLabel: "Hecho",
    challengeCompletionToast: "Desafío completado",
    challengeCompleteErrorFallback: "Error al completar el desafío",
    streakDaysSuffix: "días seguidos",
    longestStreakDesc: "récord personal",
    noChallengesLabel: "No hay desafíos diarios disponibles.",
    achievementBadgeAria: "Logro: {name}. {description}",
    a11y: {
      levelProgress: "Progresión de nivel",
      challengeProgress: "Progresión del desafío",
    },
  },
} as const;

export default catalog;
