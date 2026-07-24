const apiDocs = {
  apiDocs: {
  "seoTitle": "Documentación de API",
  "seoDescription": "Explora los endpoints disponibles y prueba solicitudes directamente desde la aplicación.",
  "title": "Referencia de API",
  "intro": "Revisa la superficie de tu API y ejecuta comprobaciones de endpoints en el probador integrado.",
  "endpointNavigator": "Navegación de endpoints",
  "groups": {
    "untagged": "Sin etiqueta"
  },
  "state": {
    "loading": "Cargando especificación de API",
    "errorRetryable": "El servicio no está disponible temporalmente. Reintenta.",
    "errorNonRetryable": "No se pudo cargar la documentación de la API.",
    "unauthorized": "No tienes autorización para ver la documentación de la API.",
    "empty": "No se encontraron endpoints de API."
  },
  "actions": {
    "retry": "Reintentar"
  },
  "a11y": {
    "endpointNavigation": "Navegación de endpoints"
  },
  "endpoint": {
    "noDescription": "No se proporcionó descripción.",
    "deprecated": "Obsoleto",
    "methodLabel": "Método",
    "operationIdLabel": "ID de operación",
    "openTester": "Abrir probador",
    "navigateAria": "Navegar a {method} {path}",
    "openTesterAria": "Abrir probador para {method} {path}"
  },
  "tester": {
    "title": "Probador de endpoint",
    "lifecycleTitle": "Ciclo de vida de la solicitud",
    "pathParametersIntro": "Parámetros de ruta",
    "queryParametersIntro": "Parámetros de consulta",
    "requestBodyIntro": "Cuerpo de solicitud",
    "requestBodyAria": "Carga JSON del cuerpo de solicitud",
    "noRequestBodyTemplate": "La especificación de OpenAPI no proporcionó una plantilla de cuerpo.",
    "parameterLabel": "Parámetro {name}",
    "send": "Enviar solicitud",
    "sending": "Enviando",
    "close": "Cerrar",
    "closeAria": "Cerrar probador de endpoint",
    "responseTitle": "Respuesta",
    "responseStatusLabel": "Estado {status}: {text}",
    "durationLabel": "Duración {duration} ms",
    "errorFallback": "La solicitud falló sin un error detallado.",
    "invalidPath": "Todos los parámetros de ruta son obligatorios.",
    "requestFailure": "No se pudo ejecutar la solicitud.",
    "requestErrorToast": "La solicitud falló",
    "emptyResponseToast": "La solicitud terminó sin cuerpo de respuesta",
    "requestSuccessToast": "Solicitud completada correctamente",
    "emptyResponse": "La respuesta no devolvió cuerpo.",
    "requestTraceTitle": "Seguimiento de solicitud",
    "requestMethodLabel": "Método",
    "steps": {
      "configure": "Configurar",
      "send": "Enviar",
      "response": "Revisar respuesta"
    },
    "metadataTitle": "Metadatos de respuesta",
    "metadata": {
      "columns": {
        "label": "Etiqueta",
        "value": "Valor"
      },
      "responseStatus": "Estado",
      "duration": "Duración",
      "responseHeaders": "Encabezados de respuesta"
    },
    "responseHeadersLabel": "Encabezados de respuesta",
    "noResponseHeaders": "No hay encabezados de respuesta."
  }
},
} as const;

export default apiDocs;
