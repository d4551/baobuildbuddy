const aiDashboard = {
  aiDashboard: {
  "title": "Panel de IA",
  "subtitle": "Gestiona la disponibilidad de proveedores, prueba conectividad y configura tu modelo preferido en una superficie de control centralizada.",
  "stats": {
    "totalRequestsTitle": "Total de Solicitudes",
    "totalRequestsDesc": "Mensajes enviados a través de servicios de IA",
    "successRateTitle": "Tasa de Éxito",
    "successRateDesc": "Respuestas del asistente respecto a las solicitudes",
    "averageResponseTitle": "Tiempo de Respuesta Medio",
    "averageResponseDesc": "Latencia medida en solicitudes de chat",
    "sessionsTitle": "Sesiones",
    "sessionsDesc": "Proveedor activo: {provider}"
  },
  "preference": {
    "title": "Preferencia de Proveedor",
    "description": "Elige el proveedor principal y modelo por defecto para chat y generación con IA.",
    "providerLegend": "Proveedor",
    "providerAria": "Proveedor de IA preferido",
    "modelLegend": "Modelo",
    "modelAria": "Modelo de IA preferido",
    "selectProviderOption": "Seleccionar proveedor",
    "selectModelOption": "Seleccionar modelo",
    "providerNotConfiguredOption": "{provider} (No configurado)",
    "saveButton": "Guardar Preferencia",
    "saveAria": "Guardar proveedor y modelo preferidos",
    "refreshButton": "Actualizar",
    "refreshAria": "Actualizar datos del panel de IA"
  },
  "providerCard": {
    "configuredBadge": "Configurado",
    "notConfiguredBadge": "No configurado",
    "testButton": "Probar Conexión",
    "testAria": "Probar conectividad de {provider}",
    "configureButton": "Configurar",
    "configureAria": "Abrir configuración para {provider}",
    "testingLabel": "Probando..."
  },
  "availability": {
    "available": "Disponible",
    "unavailable": "No disponible"
  },
  "health": {
    "healthy": "Saludable",
    "degraded": "Degradado",
    "down": "Caído",
    "unconfigured": "No configurado"
  },
  "alerts": {
    "noProvidersTitle": "No se detectaron proveedores",
    "noProvidersDescription": "Configura al menos un proveedor de IA en Configuración para habilitar chat y generación.",
    "testSuccessTitle": "Conectividad OK",
    "testErrorTitle": "Error de conectividad"
  },
  "tests": {
    "localSuccess": "El proveedor de IA local es accesible.",
    "localFailure": "El proveedor de IA local no es accesible.",
    "missingCredential": "No hay credencial disponible para este proveedor.",
    "connectionSuccess": "Conexión exitosa.",
    "connectionFailure": "Conexión fallida."
  },
  "errors": {
    "usageLoadFailed": "Error al cargar métricas de uso de IA.",
    "modelsLoadFailed": "Error al cargar catálogo de modelos.",
    "localConnectivityFailed": "Error al verificar conectividad del proveedor local.",
    "providerTestFailed": "Error en la prueba del proveedor.",
    "preferenceSaveFailed": "Error al guardar preferencia de IA."
  },
  "toasts": {
    "loadFailed": "Error al cargar datos del panel de IA.",
    "preferenceSaved": "Preferencia de IA guardada.",
    "preferenceSaveFailed": "Error al guardar preferencia de IA."
  }
},
} as const;

export default aiDashboard;
