const catalog = {
  skillsPathwaysPage: {
    seoTitle: "Rutas de Carrera",
    seoDescription:
      "Evalúa tu preparación profesional y descubre rutas de rol según tus habilidades transferibles mapeadas.",
    title: "Rutas de Carrera",
    subtitle:
      "Sigue tu preparación y explora rutas generadas desde tu evidencia de habilidades mapeadas.",
    retryButtonLabel: "Reintentar",
    retryAria: "Reintentar carga de rutas de carrera",
    gamification: {
      levelLabel: "Nvl {level}",
      openProgressAria: "Abrir progreso de gamificación",
      retryAria: "Reintentar carga del progreso de gamificación",
      retryButton: "Reintentar",
      unavailableHint: "Progreso no disponible",
    },
    categories: {
      technical: "Técnico",
      softSkills: "Habilidades Blandas",
      industryKnowledge: "Conocimiento de la Industria",
      portfolio: "Portafolio",
    },
    readiness: {
      title: "Tu Preparación Profesional",
      overallReadinessLabel: "Preparación general",
      overallReadinessAria: "Puntuación de preparación general {score} por ciento",
      categoryScoresLabel: "Puntuaciones por categoría",
      categoryScoreAria: "Puntuación de preparación {category} {score} por ciento",
      topImprovementsTitle: "Principales mejoras",
      nextStepsTitle: "Próximos pasos",
      feedback: {
        empty: "Aún no hay datos de preparación para {category}.",
        early: "Etapa inicial en {category}. Enfócate en añadir más mapeos y evidencia.",
        developing: "Desarrollo en {category}. Sigue añadiendo ejemplos mapeados y evidencia.",
        good: "Buen nivel en {category}. Sigue profundizando para fortalecer esta área.",
        excellent: "Excelente nivel en {category}. Estás bien preparado en esta área.",
      },
      improvements: {
        imp_tech_map:
          "Mapea más habilidades técnicas de juego a habilidades técnicas profesionales.",
        imp_conf_up: "Aumenta la confianza de tus mapeos técnicos existentes.",
        imp_lead_comm: "Mapea más experiencias de liderazgo y comunicación.",
        imp_team_examples: "Añade ejemplos concretos de colaboración en equipo.",
        imp_industry_research:
          "Investiga más aplicaciones de industria para tus habilidades mapeadas.",
        imp_role_link: "Conecta habilidades mapeadas con roles objetivo concretos.",
        imp_evidence_add:
          "Añade evidencia a tus habilidades mapeadas con clips, capturas o documentos.",
        imp_portfolio_build: "Construye proyectos de portafolio para demostrar habilidades.",
        imp_achievements_doc: "Documenta logros medibles para tus mejores mapeos.",
        imp_transfer_strengthen:
          "Refuerza la transferencia técnica mapeando mecánicas de juego a conceptos de ingeniería.",
        imp_leadership_highlight:
          "Destaca experiencias de liderazgo y comunicación desde contextos de juego.",
        imp_coverage_broaden: "Amplía cobertura mapeando entre 10 y 15 habilidades diversas.",
        imp_examples_refine: "Refina tus mapeos actuales con ejemplos más específicos.",
        imp_certs_pursue: "Busca certificaciones que validen tus fortalezas técnicas.",
        imp_network_pro: "Haz networking con profesionales de tu industria objetivo.",
      },
      nextStepItems: {
        step_apply_roles: "Empieza a postular a roles objetivo.",
        step_network_industry: "Conecta con profesionales del sector.",
        step_prepare_interviews: "Prepárate para entrevistas técnicas.",
        step_polish_linkedin: "Optimiza tu perfil de LinkedIn.",
        step_complete_portfolio: "Completa tu portafolio con 3-5 proyectos sólidos.",
        step_map_skills_15: "Mapea 5 habilidades más para llegar a 15 o más.",
        step_evidence_top: "Añade evidencia a tus 10 habilidades principales.",
        step_research_targets: "Investiga empresas y roles objetivo.",
        step_map_skills_10: "Mapea 10 o más habilidades de juego a carrera.",
        step_start_portfolio: "Empieza a construir proyectos de portafolio.",
        step_evidence_abilities: "Añade evidencia para demostrar tus capacidades.",
        step_explore_pathways: "Explora rutas de carrera que encajen con tus habilidades.",
        step_map_skills_5: "Mapea tus primeras 5 habilidades de juego.",
        step_explore_categories: "Explora diferentes categorías de habilidades.",
        step_learn_careers: "Conoce opciones profesionales de la industria del juego.",
        step_setup_profile: "Configura tu perfil profesional.",
      },
      emptyState:
        "Los datos de preparación no están disponibles. Añade mapeos y ejecuta el análisis primero.",
      emptyStateTitle: "Los datos de preparación aún no están disponibles",
      emptyStateDescription:
        "Añade más evidencia de habilidades mapeadas y vuelve a ejecutar el análisis para completar esta sección.",
    },
    pathways: {
      title: "Recomendaciones de Rutas",
      requiredSkillsTitle: "Habilidades requeridas",
      matchScoreLabel: "Puntuación de coincidencia",
      matchScoreAria: "Puntuación de coincidencia de ruta {title} {score} por ciento",
      estimatedTimeLabel: "Tiempo estimado para entrar:",
      marketTrendLabel: "Tendencia del mercado:",
      marketTrend: {
        growing: "En crecimiento",
        stable: "Estable",
        declining: "En declive",
      },
      emptyState:
        "Sin rutas disponibles. Añade más habilidades mapeadas para generar recomendaciones.",
      emptyStateTitle: "Aún no hay rutas disponibles",
      emptyStateDescription:
        "Amplía las habilidades mapeadas para desbloquear mejores recomendaciones y cobertura de rutas.",
    },
    errors: {
      loadFailed: "Error al cargar datos de rutas de carrera",
      pathwaysLoadFailed: "Error al cargar recomendaciones de rutas",
      readinessLoadFailed: "Error al cargar evaluación de preparación",
      gamificationLoadFailed: "Error al cargar el progreso de gamificación en esta página",
    },
  },
} as const;

export default catalog;
