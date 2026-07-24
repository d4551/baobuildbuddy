const automationjobApply = {
  automation: {
    jobApply: {
  "title": "Automatización de Solicitudes",
  "bootstrapError": "No se pudo cargar la automatización de solicitudes.",
  "bootstrapRetry": "Reintentar",
  "bootstrapRetryAria": "Reintentar carga de la automatización de solicitudes",
  "emptyResumesTitle": "Se requiere un currículum",
  "emptyResumesDescription": "Crea un currículum antes de ejecutar la automatización de solicitud. La ejecución necesita un currículum seleccionado.",
  "emptyResumesCta": "Abrir Creador de Currículum",
  "emptyResumesCtaAria": "Abrir el creador de currículum para crear uno para la solicitud",
  "jobUrlLegend": "URL del Empleo",
  "jobUrlPlaceholder": "Pega la URL de la oferta de empleo",
  "jobUrlAria": "URL de la oferta de empleo",
  "resumeLegend": "Currículum",
  "resumeAria": "Seleccionar currículum",
  "selectResumeOption": "Seleccionar currículum",
  "resumeFallbackName": "Currículum {id}",
  "coverLetterLegend": "Carta de Presentación (opcional)",
  "coverLetterAria": "Seleccionar carta opcional",
  "noCoverLetterOption": "Sin carta",
  "coverLetterOption": "{position} en {company}",
  "unknownCompany": "Desconocido",
  "unknownPosition": "Puesto",
  "jobIdLegend": "ID de Empleo (opcional)",
  "jobIdPlaceholder": "ID opcional para correlación",
  "jobIdAria": "ID de empleo para correlación",
  "runButton": "Ejecutar Solicitud",
  "runButtonAria": "Ejecutar automatización de solicitud",
  "submitErrorTitle": "Error al enviar",
  "submitErrorFallback": "Error al iniciar automatización de solicitud",
  "runStartedTitle": "Ejecución iniciada",
  "runIdLabel": "ID de ejecución: {id}",
  "statusLabel": "Estado: {status}",
  "openRunDetailLink": "Abrir detalle",
  "openRunDetailAria": "Abrir página de detalle de ejecución {id}",
  "schedule": {
    "legend": "Programar Ejecución",
    "aria": "Programar hora de ejecución",
    "hint": "Elige cuándo debe iniciar esta ejecución.",
    "button": "Programar Ejecución",
    "buttonAria": "Programar ejecución de automatización de solicitud",
    "createdTitle": "Ejecución programada",
    "scheduledForLabel": "Programada para: {date}",
    "invalidRunAt": "Elige una fecha y hora futura válida."
  },
  "stream": {
    "title": "Stream de ejecución en vivo",
    "subtitle": "Sigue las actualizaciones de progreso mientras se ejecuta la automatización.",
    "aria": "Resumen del estado de ejecución en vivo",
    "runIdTitle": "ID de ejecución",
    "statusTitle": "Estado",
    "stateLabel": "Estado actual del stream",
    "progressTitle": "Progreso",
    "progressAria": "Progreso de la ejecución automatizada",
    "currentStepLabel": "Paso {current} de {total}",
    "retryButton": "Reintentar stream",
    "retryAria": "Reintentar stream de ejecución",
    "cancelButton": "Detener stream",
    "cancelAria": "Detener suscripción al stream",
    "errorTitle": "Error del stream",
    "startErrorFallback": "No se pudo iniciar el stream en vivo para esta ejecución.",
    "states": {
      "idle": "Inactivo",
      "loading": "Conectando al stream",
      "success": "Completado",
      "empty": "Ninguna ejecución seleccionada",
      "errorRetryable": "Problema temporal del stream",
      "errorNonRetryable": "Stream no disponible",
      "unauthorized": "Sin autorización"
    },
    "steps": {
      "queued": "En cola",
      "running": "En ejecución",
      "completed": "Completado"
    },
    "eventType": {
      "progress": "Progreso",
      "result": "Resultado",
      "error": "Fallo"
    },
    "eventMessages": {
      "resultSuccess": "La ejecución terminó correctamente.",
      "resultError": "La ejecución terminó con error.",
      "protocolError": "El runner reportó un error de protocolo."
    },
    "eventsAria": "Línea de tiempo de eventos en vivo",
    "eventsTitle": "Eventos recientes",
    "events": {
      "empty": "Aún no hay eventos.",
      "columns": {
        "timestamp": "Marca de tiempo",
        "stage": "Etapa",
        "status": "Estado",
        "message": "Mensaje"
      }
    }
  }
},
  },
} as const;

export default automationjobApply;
