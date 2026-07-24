const automationrunDetail = {
  automation: {
    runDetail: {
  "title": "Detalle de Ejecución",
  "backButton": "Atrás",
  "backToRunsAria": "Volver a ejecuciones",
  "breadcrumbs": {
    "dashboard": "Panel",
    "runs": "Ejecuciones de Automatización",
    "detailFallback": "Detalle de Ejecución"
  },
  "loadErrorTitle": "Error al cargar ejecución",
  "loadErrorFallback": "No se pudo cargar la ejecución.",
  "loadingStatus": "Cargando...",
  "inputSummaryEmpty": "Sin entrada registrada",
  "inputSummary": "{count} campo | {count} campos",
  "outputSummaryEmpty": "Sin salida",
  "outputSummaryPresent": "Salida recibida",
  "noInputPayload": "Sin payload de entrada",
  "noOutputPayload": "Sin payload de salida",
  "inputPayloadTitle": "Payload de Entrada",
  "outputPayloadTitle": "Payload de Salida",
  "screenshotsTitle": "Capturas",
  "noScreenshots": "Sin capturas disponibles.",
  "screenshotAlt": "Captura de automatización {index}",
  "screenshotLinkLabel": "Abrir captura {index}",
  "screenshotLoadError": "No se pudo previsualizar la captura {index}.",
  "loadingAria": "Cargando detalle de ejecución",
  "retryButton": "Reintentar",
  "retryAria": "Reintentar carga del detalle de ejecución",
  "progressSummary": "{percent}% completado",
  "progressAria": "Progreso de la ejecución automatizada",
  "states": {
    "idle": "Inactivo",
    "loading": "Cargando detalle de ejecución",
    "success": "Ejecución cargada",
    "empty": "Ejecución no encontrada",
    "errorRetryable": "Error temporal al cargar la ejecución",
    "errorNonRetryable": "No se pudo cargar el detalle de la ejecución",
    "unauthorized": "Sin autorización"
  },
  "timeline": {
    "aria": "Línea de tiempo de la ejecución",
    "title": "Línea de tiempo de ejecución",
    "empty": "No hay eventos de línea de tiempo disponibles.",
    "stageProgress": "Actualización de progreso",
    "stageResult": "Resultado de ejecución",
    "stageError": "Error del runner",
    "stageOutputStep": "Paso de salida",
    "stageRunStatus": "Estado de ejecución",
    "resultSuccess": "La ejecución terminó correctamente.",
    "resultError": "La ejecución terminó con error.",
    "columns": {
      "time": "Hora",
      "stage": "Etapa",
      "status": "Estado",
      "message": "Mensaje"
    }
  },
  "stats": {
    "inputTitle": "Entrada",
    "inputDescription": "Campos del payload",
    "outputTitle": "Salida",
    "outputDescription": "Instantánea del resultado",
    "statusTitle": "Estado",
    "typeDescription": "Tipo: {type}",
    "errorYes": "Sí",
    "errorNone": "Sin error"
  }
},
  },
} as const;

export default automationrunDetail;
