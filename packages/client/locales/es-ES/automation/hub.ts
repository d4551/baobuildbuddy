const catalog = {
  automation: {
    hub: {
      pageTitle: "Centro de Automatización",
      pageDescription:
        "Ejecuta y sigue flujos de automatización en extracción, solicitudes de empleo y respuestas por email.",
      title: "Automatización",
      viewRunsButton: "Ver Ejecuciones",
      pipelineTitle: "Flujo de Trabajo",
      pipelineDescription:
        "Pasa del descubrimiento de empleos a extracción, personalización, automatización y progresión XP en un solo flujo.",
      pipelineAria: "Flujo de trabajo de carrera",
      pipelineNextStepLabel: "Siguiente hito del flujo: {step}",
      loadErrorFallback: "Error al cargar métricas del centro de automatización",
      retryButtonLabel: "Reintentar",
      retryAria: "Reintentar carga de métricas del centro de automatización",
      stats: {
        totalRunsTitle: "Total de Ejecuciones",
        totalRunsDescription: "Ejecuciones de automatización registradas",
        todayRunsTitle: "Ejecuciones de Hoy",
        todayRunsDescription: "Iniciadas hoy",
        successRateTitle: "Tasa de Éxito",
        successRateDescription: "Historial de ejecuciones completadas",
      },
      audit: {
        title: "Auditoría de Capacidades RPA",
        description:
          "Verifica qué flujos de automatización del navegador están implementados, configurados y son observables.",
        aria: "Auditoría de capacidades RPA",
        openScraperButton: "Abrir Centro de Extracción",
        openScraperAria: "Abrir el centro de extracción con destinos RPA ampliados",
        loadErrorFallback: "No se pudo cargar la auditoría de capacidades RPA.",
        available: "Disponible",
        needsConfig: "Requiere Configuración",
        unavailable: "No Disponible",
        noIssues: "No se detectaron incidencias.",
        category: {
          job_apply: "Solicitud",
          scrape: "Extracción",
        },
        summary: {
          total: "Capacidades",
          totalDesc: "Flujos RPA implementados",
          configured: "Configuradas",
          configuredDesc: "Listas en el entorno actual",
          live: "Eventos en Vivo",
          liveDesc: "Emiten actualizaciones de progreso",
        },
        tableAria: "Detalle de la auditoría de capacidades RPA",
        columns: {
          name: "Capacidad",
          category: "Categoría",
          configured: "Configurada",
          scheduled: "Programada",
          history: "Historial",
          live: "En Vivo",
          notes: "Notas",
        },
      },
      cards: {
        scraper: {
          title: "Flujos de Extracción",
          description: "Ejecuta extractores de estudios y empleos para actualizar datos.",
          button: "Abrir Centro de Extracción",
        },
        jobApply: {
          title: "Solicitud de Empleo",
          description:
            "Inicia o programa una solicitud RPA usando tu currículum y carta guardados.",
          button: "Abrir Solicitud de Empleo",
        },
        emailResponse: {
          title: "Respuesta por Email",
          description: "Genera respuestas de email asistidas por IA y sigue cada ejecución.",
          button: "Abrir Respuesta por Email",
        },
        runHistory: {
          title: "Historial de Ejecuciones",
          description: "Inspecciona payloads completos, capturas y salida de ejecución.",
          button: "Abrir Historial",
        },
      },
    },
  },
} as const;

export default catalog;
