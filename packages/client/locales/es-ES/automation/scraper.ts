const automationscraper = {
  automation: {
    scraper: {
      title: "Centro de Operaciones de Extracción",
      subtitle:
        "Actualiza datos de estudios y empleos, luego lanza la práctica de entrevistas desde los roles extraídos.",
      stepsAria: "Flujo de extracción",
      steps: {
        run: "Ejecutar Extractor",
        review: "Revisar Resultados",
        interview: "Entrevista contra Empleo",
      },
      state: {
        idle: "Inactivo",
        running: "En ejecución",
        success: "Éxito",
      },
      notRunYet: "Aún no ejecutado",
      lastRunLabel: "Última ejecución: {value}",
      studioCard: {
        description: "Obtén los últimos perfiles de estudios y metadatos de entrevista.",
        runAria: "Ejecutar extractor de estudios",
        runButton: "Ejecutar Extractor de Estudios",
      },
      jobCard: {
        description:
          "Obtén las últimas ofertas de la industria del juego y sincronízalas con el tablón.",
        runAria: "Ejecutar extractor de empleos",
        runButton: "Ejecutar Extractor de Empleos",
      },
      stats: {
        availableJobsTitle: "Empleos Extraídos Disponibles",
        availableJobsDescription: "Inventario actual listo para entrevista",
        enrichedJobsTitle: "Empleos Enriquecidos por IA",
        enrichedJobsDescription: "Filas con contexto de estudio y señales de contratación",
        jobStatusTitle: "Estado del Extractor de Empleos",
        jobStatusDescription: "Estado de la última ejecución",
        interviewEntryTitle: "Entrada a Entrevista",
        interviewEntryValue: "1 clic",
      },
      table: {
        title: "Empleos Extraídos Listos para Entrevista",
        openBoardButton: "Abrir Bolsa de Empleo",
        emptyState: "Sin empleos aún. Ejecuta el extractor para poblar objetivos de entrevista.",
        aria: "Empleos extraídos disponibles para entrevista",
        interviewButton: "Entrevista para este Empleo",
        interviewAria: "Iniciar entrevista para {title} en {company}",
        actionsLabel: "Acciones",
        personaSummaryLabel: "Perfil:",
        columns: {
          role: "Rol",
          company: "Empresa",
          location: "Ubicación",
          posted: "Publicado",
        },
      },
      messages: {
        studioCompleted: "Extracción de estudios completada. Datos del directorio actualizados.",
        studioCompletedWithXp: "Extracción de estudios completada (+{xp} XP). Datos actualizados.",
        jobCompleted:
          "Extracción de empleos completada. Feed actualizado y listo para entrevistas.",
        jobCompletedWithXp:
          "Extracción de empleos completada (+{xp} XP). Feed actualizado y listo para entrevistas.",
      },
      schedule: {
        legend: "Programar Ejecución",
        hint: "Elige cuándo debe ejecutarse este extractor.",
        aria: "Fecha y hora programadas para la extracción",
        button: "Programar Ejecución",
        buttonAria: "Programar ejecución del extractor",
        invalidRunAt: "Elige una fecha y hora futuras para la ejecución programada.",
        createdMessage: "La ejecución de extracción se programó correctamente.",
        scheduledForLabel: "Programada para: {date}",
        statusLabel: "Estado: {status}",
      },
      openRunDetailButton: "Abrir Detalle",
      openRunDetailAria: "Abrir detalle de ejecución de automatización para {id}",
      toasts: {
        studioReward: "Extracción de estudios completada (+{xp} XP)",
        jobReward: "Extracción de empleos completada (+{xp} XP)",
      },
      errors: {
        studioFailed: "Error en extractor de estudios",
        jobFailed: "Error en extractor de empleos",
        scheduleFailed: "Error al programar la extracción",
        rewardFailed: "Error al acreditar progreso del extractor",
        capabilitiesLoadFailed: "No se pudo cargar la auditoría de capacidades del extractor",
        capabilitiesRetry: "Reintentar",
        capabilitiesRetryAria: "Reintentar carga de la auditoría de capacidades del extractor",
        jobsFeedLoadFailed: "No se pudo actualizar el listado de empleos para esta página",
        jobsFeedRetry: "Reintentar",
        jobsFeedRetryAria: "Reintentar carga del listado de empleos del centro de extracción",
      },
    },
  },
} as const;

export default automationscraper;
