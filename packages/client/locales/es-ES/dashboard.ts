const catalog = {
  dashboard: {
    pageTitle: "Panel",
    seoDescription:
      "Seguimiento de oportunidades, progreso del currículum, práctica de entrevistas y señales de actividad en un panel operativo.",
    welcomeDescription: "Tu sistema operativo de carrera con IA para la industria de videojuegos.",
    welcomeHeading: {
      named: "¡Bienvenido, {name}!",
      fallback: "¡Bienvenido!",
    },
    emptyStateTitle: "Inicia tu espacio de trabajo profesional",
    emptyStateDescription:
      "Completa la configuración, añade tu primer currículum y empieza a seguir oportunidades para llenar este panel.",
    onboardingChecklistTitle: "Completa estos pasos de incorporación",
    setupCtaLabel: "Completar Configuración",
    metricsSummaryLabel: "Resumen de {brand}",
    pipelineTitle: "Flujo de Carrera",
    pipelineDescription:
      "Mantén el impulso en descubrimiento, extracción, personalización de currículum, automatización de solicitudes y progresión de XP.",
    pipelineAria: "Flujo de trabajo de carrera",
    pipelineNextStepLabel: "Siguiente paso: {step}",
    dailyChallengeTitle: "Desafío Diario",
    recentActivityTitle: "Actividad Reciente",
    recentActivityEmptyLabel: "Sin actividad reciente",
    quickActionsTitle: "Acciones Rápidas",
    levelLabel: "Nivel",
    streakLabel: "días seguidos",
    retryButtonLabel: "Reintentar",
    retryAria: "Reintentar carga de datos del panel",
    loadErrorFallback: "Error al cargar datos del panel",
    activityFallback: "Actividad",
    heroPhrases: {
      findDreamRole: "Encuentra tu trabajo ideal",
      buildPortfolio: "Construye tu portafolio",
      prepareInterviews: "Prepárate para entrevistas",
      levelUpSkills: "Mejora tus habilidades profesionales",
    },
    onboarding: {
      profile: "Perfil",
      aiProvider: "Proveedor de IA",
      resume: "Currículum",
      jobs: "Búsqueda de Empleo",
    },
    pipeline: {
      steps: {
        search: "Buscar Empleos",
        scrape: "Extraer Ofertas Nuevas",
        customize: "Personalizar Currículum",
        apply: "Aplicar Automáticamente",
        gamify: "Ganar XP",
      },
      status: {
        complete: "Completo",
        inProgress: "En progreso",
        pending: "Pendiente",
      },
    },
    stats: {
      savedJobsTitle: "Empleos Guardados",
      savedJobsCta: "Abrir espacio de empleos",
      resumesTitle: "Currículums",
      resumesCta: "Editar biblioteca de currículums",
      interviewSessionsTitle: "Sesiones de Entrevista",
      interviewSessionsCta: "Practicar flujo de entrevista",
      levelProgressAria: "Progreso del nivel actual",
      challengeProgressAria: "Progreso de completar el desafío diario",
    },
    quickActions: {
      actions: {
        browseJobs: "Explorar Empleos",
        buildResume: "Crear Currículum",
        practiceInterview: "Practicar Entrevista",
        aiChat: "Chat IA",
      },
    },
    relativeTime: {
      minutesAgo: "hace {count}m",
      hoursAgo: "hace {count}h",
      daysAgo: "hace {count}d",
    },
    errors: {
      profileLoadFallback: "Error al cargar el perfil de usuario",
      metricsLoadFallback: "Error al cargar métricas del panel",
      gamificationLoadFallback: "Error al cargar progreso de gamificación",
      challengesLoadFallback: "Error al cargar desafíos diarios",
    },
  },
} as const;

export default catalog;
