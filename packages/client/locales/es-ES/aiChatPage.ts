const catalog = {
  aiChatPage: {
    title: "Chat con {brand}",
    seoTitle: "Chat IA de {brand}",
    seoDescription:
      "Habla con tu copiloto de carrera con IA para estrategia de CV, preparación de entrevistas y planificación de automatización.",
    subtitle: "Tu asistente de carrera con IA para la industria del juego",
    clearAria: "Limpiar conversación del chat",
    clearButton: "Limpiar",
    logAria: "Conversación del chat con IA",
    youLabel: "Tú",
    inputPlaceholder: "Pregunta a {assistant} sobre tu carrera en la industria del juego",
    inputAria: "Mensaje del chat",
    sendAria: "Enviar mensaje del chat",
    sendButton: "Enviar",
    emptyTitle: "Tu asistente está listo",
    emptyDescription:
      "Usa las sugerencias junto a la conversación o pide coaching, ayuda de redacción, investigación o guía de automatización.",
    composerHint: "Presiona Enter para enviar. Usa Shift+Enter para una nueva línea.",
    composerIdleStatus: "Listo cuando tú lo estés",
    composerBusyStatus: "Generando una respuesta...",
    contextPanelTitle: "Contexto actual",
    contextPanelDescription:
      "El asistente usa tu página activa, la entidad enfocada y las señales recientes del espacio de trabajo.",
    promptsTitle: "Prompts sugeridos",
    promptsDescription:
      "Carga uno de estos prompts en el editor con el contexto actual ya visible.",
    voiceSettings: {
      legend: "Perfiles de Modelo de Voz",
      sttProviderLabel: "Proveedor de voz a texto",
      sttProviderAria: "Selección de proveedor de voz a texto",
      sttModelLabel: "Modelo de voz a texto",
      sttModelAria: "Selección de modelo de voz a texto",
      ttsProviderLabel: "Proveedor de texto a voz",
      ttsProviderAria: "Selección de proveedor de texto a voz",
      ttsModelLabel: "Modelo de texto a voz",
      ttsModelAria: "Selección de modelo de texto a voz",
      hint: "Estos perfiles de proveedor/modelo se guardan para flujos de voz en chat y automatización.",
      saveButton: "Guardar Perfil de Voz",
      saveAria: "Guardar preferencias de proveedor y modelo de voz",
      saveSuccess: "Perfil de voz guardado",
      saveErrorFallback: "No se pudo guardar el perfil de voz",
      unsavedHint: "Tienes cambios sin guardar en el perfil de voz.",
      providers: {
        browser: "Navegador",
        custom: "Personalizado",
      },
    },
  },
} as const;

export default catalog;
