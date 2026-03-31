const catalog = {
  automation: {
    runs: {
      title: "Ejecuciones de Automatización",
      backButton: "Volver a Automatización",
      backToAutomation: "Volver al resumen de automatización",
      typeLabel: "Tipo",
      typeFilterAria: "Filtrar ejecuciones por tipo",
      allTypes: "Todos los tipos",
      statusLabel: "Estado",
      statusFilterAria: "Filtrar ejecuciones por estado",
      allStatuses: "Todos los estados",
      tableAriaLabel: "Historial de ejecuciones",
      emptyJobId: "N/D",
      emptyState: "No se encontraron ejecuciones.",
      loadingLabel: "Cargando ejecuciones...",
      loadErrorTitle: "No se pueden cargar ejecuciones",
      loadErrorFallback: "No se pudo cargar el historial.",
      openRunDetailAria: "Abrir detalles de ejecución {id}",
      openButton: "Abrir",
      liveBadge: "En vivo",
      liveBadgeAria: "Estado de ejecución en vivo",
      columns: {
        id: "ID de Ejecución",
        type: "Tipo",
        status: "Estado",
        progress: "Progreso",
        job: "Empleo",
        updated: "Actualizado",
        actions: "Acciones",
      },
      typeOptions: {
        scrape: "Extractor",
        job_apply: "Solicitud de Empleo",
      },
      statusOptions: {
        pending: "Pendiente",
        running: "En ejecución",
        success: "Éxito",
      },
    },
  },
} as const;

export default catalog;
