const studioAnalytics = {
  studioAnalytics: {
    title: "Analíticas de Estudios",
    description:
      "Revisa la distribución de estudios, la cobertura de trabajo remoto y las tendencias tecnológicas compartidas del conjunto de estudios indexado.",
    retryAria: "Reintentar carga de analíticas",
    retryButton: "Reintentar",
    openDirectoryAria: "Abrir el directorio de estudios",
    emptyTitle: "No hay analíticas de estudios disponibles",
    emptyDescription:
      "Actualiza los datos de estudios desde el directorio o el centro de extracción para rellenar las analíticas de este espacio.",
    progressAria: "Progreso de {label}",
    remoteWorkProgressAria: "Disponibilidad de trabajo remoto: {value} por ciento",
    overview: {
      totalStudiosTitle: "Total de Estudios",
      totalStudiosDesc: "En base de datos",
      remoteFriendlyTitle: "Remoto Amigable",
      remoteFriendlyDesc: "Ofrecen posiciones remotas",
      indieStudiosTitle: "Estudios Indie",
      percentageOfTotal: "{value}% del total",
    },
    sections: {
      byTypeTitle: "Estudios por Tipo",
      bySizeTitle: "Estudios por Tamaño",
      topTechnologiesTitle: "Tecnologías Más Comunes",
      topTechnologiesDescription: "Tecnologías usadas en estudios de juegos",
      remoteAvailabilityTitle: "Disponibilidad de Trabajo Remoto",
      offerRemoteLabel: "Ofrecen Remoto",
      remoteFriendlyTitle: "Remoto Amigable",
      onSiteOnlyTitle: "Solo Presencial",
    },
    errors: {
      loadFailed: "Error al cargar datos de analíticas",
    },
  },
} as const;

export default studioAnalytics;
