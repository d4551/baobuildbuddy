const catalog = {
  jobCard: {
    viewAria: "Ver empleo: {title} en {company}",
    saveAria: "Guardar empleo",
    unsaveAria: "Quitar de guardados",
    remoteBadge: "Remoto",
    hybridBadge: "Híbrido",
    matchBadge: "{score}% Coincidencia",
    matchBadgeAria: "Puntuación de coincidencia {score} por ciento",
    moreTechnologies: "+{count} más",
    relativeTime: {
      today: "Hoy",
      yesterday: "Ayer",
      daysAgo: "hace {count}d",
      weeksAgo: "hace {count}s",
      monthsAgo: "hace {count}mes",
    },
  },
} as const;

export default catalog;
