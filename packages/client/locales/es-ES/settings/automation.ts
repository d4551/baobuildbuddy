const catalog = {
  settings: {
    automation: {
      title: "Automatización y RPA",
      subtitle: "Configura valores por defecto de automatización del navegador para solicitudes.",
      headlessTitle: "Modo Sin Interfaz",
      headlessDescription: "Ejecutar automatización sin interfaz visible",
      headlessAria: "Modo sin interfaz",
      smartSelectorsTitle: "Selectores IA Inteligentes",
      smartSelectorsDescription: "Detectar campos de formulario dinámicamente",
      smartSelectorsAria: "Selectores inteligentes",
      autoScreenshotsTitle: "Guardar Capturas Automáticamente",
      autoScreenshotsDescription: "Capturar cada etapa de automatización",
      autoScreenshotsAria: "Guardar capturas automáticamente",
      timeoutLegend: "Tiempo de Espera (segundos)",
      timeoutAria: "Tiempo de espera por defecto en segundos",
      retentionLegend: "Retención de Capturas (días)",
      retentionAria: "Retención de capturas en días",
      concurrentRunsLegend: "Max Ejecuciones Concurrentes",
      concurrentRunsAria: "Máximo de ejecuciones simultáneas",
      defaultBrowserLegend: "Navegador por Defecto",
      defaultBrowserAria: "Navegador de automatización por defecto",
      saveAria: "Guardar configuración de automatización",
      saveButton: "Guardar Automatización",
    },
  },
} as const;

export default catalog;
