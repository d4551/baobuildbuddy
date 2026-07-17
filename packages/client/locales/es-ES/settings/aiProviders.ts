const catalog = {
  settings: {
    aiProviders: {
      title: "Proveedores de IA",
      subtitle: "Mantén proveedores locales como principales y cloud como respaldo controlado.",
      openaiCompatTitle: "API compatible con OpenAI",
      openaiCompatDescription:
        "Apunta los SDK de OpenAI a esta URL base con tu clave API de Bao como Bearer (models + chat/completions).",
      openaiCompatAria: "URL base de la API compatible con OpenAI",
      expandAria: "Expandir configuración de {provider}",
      configuredBadge: "Configurado",
      endpointLabel: "URL del Endpoint",
      credentialLabel: "Clave API",
      huggingFacePlaceholder: "Introduce token de Hugging Face",
      apiKeyPlaceholder: "Introduce clave API de {provider}",
      testAria: "Probar conexión del proveedor de IA",
      testButton: "Probar",
      localModelLegend: "Nombre del modelo local",
      localModelPlaceholder: "Detectado automáticamente del servidor",
      localModelAria: "Nombre del modelo local",
      connectedBadge: "Conectado",
      failedBadge: "Fallido",
      saveAria: "Guardar credenciales del proveedor de IA",
      saveButton: "Guardar Claves API",
      connectionSuccessful: "Conexión exitosa",
      connectionFailed: "Conexión fallida",
      preferredProviderLegend: "Proveedor de IA preferido",
      preferredProviderAria: "Seleccionar proveedor de IA preferido",
      preferredProviderSaveButton: "Guardar chat por defecto",
      preferredProviderHint:
        "Este control rápido define el proveedor predeterminado para chat y conversaciones.",
      readinessTitle: "Estado de proveedores",
      readinessDescription:
        "Revisa configuración y conectividad antes de asignar proveedores a los flujos.",
      preferredProviderSaved: "Proveedor preferido actualizado",
      routingTitle: "Enrutamiento por propósito",
      routingSubtitle:
        "Asigna un proveedor y un modelo opcional a cada capacidad de IA para que chat, entrevistas, exportaciones y automatizaciones no compartan una única configuración global.",
      routingCoverageTitle: "Flujos enrutados",
      routingCoverageDescription:
        "Cada capacidad de IA puede mantener su propio proveedor y un modelo opcional.",
      saveRoutingAria: "Guardar enrutamiento de IA por propósito",
      saveRoutingButton: "Guardar enrutamiento",
      routingSaved: "Enrutamiento de IA guardado",
      purposeColumnLabel: "Propósito",
      purposeProviderLegend: "Proveedor",
      purposeProviderAria: "Seleccionar proveedor para {purpose}",
      purposeModelLegend: "Modelo específico",
      purposeModelAria: "Definir modelo específico para {purpose}",
      purposeModelPlaceholder: "Déjalo vacío para usar el modelo por defecto o la autodetección",
      purposeModelHint:
        "Usa un modelo concreto solo cuando este flujo lo necesite. Si lo dejas vacío, se mantiene el valor por defecto del proveedor.",
      purposes: {
        chat: {
          label: "Conversación",
          description: "Chat general, respuestas del asistente y conversaciones interactivas.",
        },
        interviewQuestions: {
          label: "Preguntas de entrevista",
          description:
            "Generación de preguntas, repreguntas y ritmo conversacional de la entrevista.",
        },
        interviewFeedback: {
          label: "Feedback de entrevista",
          description:
            "Puntuación de respuestas, feedback por rúbrica y resúmenes finales de entrevista.",
        },
        resume: {
          label: "Currículum",
          description: "Síntesis, mejora, puntuación y salidas estructuradas del CV.",
        },
        coverLetter: {
          label: "Carta de presentación",
          description: "Redacción, refinamiento y contenido listo para exportar de la carta.",
        },
        emailResponse: {
          label: "Respuesta por email",
          description: "Borradores de respuesta a recruiters y generación de emails automáticos.",
        },
        jobMatch: {
          label: "Ajuste al puesto",
          description: "Scoring de encaje, análisis del rol y resúmenes de recomendación.",
        },
        scrapeEnrichment: {
          label: "Enriquecimiento de scraping",
          description:
            "Enriquecimiento de perfiles de estudio y análisis de señales de contratación tras el scrape.",
        },
        automationFieldMapping: {
          label: "Mapeo de automatización",
          description:
            "Mapeo de campos, inferencia de selectores y automatización estructurada de formularios.",
        },
      },
      ollamaTipTitle: "Consejo: Ollama va por fuera de esta app",
      ollamaTipDescription:
        "Instálalo primero y sigue la configuración oficial de Ollama para tu propia máquina o proyecto en",
      ollamaTipLinkAria: "Abrir sitio web de Ollama en una pestaña nueva",
      credentialsDescription:
        "Guarda y prueba credenciales solo para los proveedores que realmente vayas a usar en flujos activos.",
    },
  },
} as const;

export default catalog;
