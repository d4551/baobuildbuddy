const floatingChat = {
  floatingChat: {
  "subtitle": "Copiloto de Carrera",
  "contextBadge": "Contexto: {context}",
  "contextAria": "Contexto actual del chat: {context}",
  "focusedEntityBadge": "Enfoque: {entity}",
  "focusedEntityAria": "Entidad enfocada en el chat: {entity}",
  "domainChip": "Ámbito: {context}",
  "sourceChip": "Superficie: {source}",
  "routeBadge": "Ruta: {route}",
  "contextChipsAria": "Chips de contexto específico del chat",
  "contextDomain": {
    "resume": "Currículum",
    "jobSearch": "Empleos",
    "interview": "Entrevista",
    "portfolio": "Portafolio",
    "skills": "Habilidades",
    "automation": "Automatización"
  },
  "entityTypes": {
    "job": "Empleo",
    "resume": "Currículum",
    "studio": "Estudio",
    "interviewSession": "Entrevista",
    "automationRun": "Automatización"
  },
  "sources": {
    "chatPage": "Página completa"
  },
  "stateChips": {
    "resumes": "{count} currículum | {count} currículums",
    "jobs": "{count} empleo seguido | {count} empleos seguidos",
    "studios": "{count} estudio | {count} estudios",
    "sessions": "{count} sesión | {count} sesiones",
    "projects": "{count} proyecto | {count} proyectos"
  },
  "expandAria": "Abrir página completa de chat",
  "expandButton": "Expandir",
  "clearAria": "Limpiar conversación del chat",
  "clearButton": "Limpiar",
  "closeAria": "Cerrar widget de chat",
  "logAria": "Conversación del chat flotante",
  "youLabel": "Tú",
  "suggestionsAria": "Sugerencias de prompts contextuales del asistente",
  "suggestionAria": "Usar prompt contextual: {prompt}",
  "emptyTitle": "Inicia una revisión rápida",
  "emptyDescription": "Pide próximos pasos, texto de seguimiento o una revisión enfocada desde la página en la que estás.",
  "composerHint": "Enter envía · Shift+Enter nueva línea.",
  "prompts": {
    "focusedEntity": "Dame coaching enfocado para {target}.",
    "resume": "¿Cómo puedo mejorar este currículum para {target}?",
    "jobSearch": "¿Cómo debo abordar este rol en {target}?",
    "interview": "Genera preguntas de preparación para entrevista en {target}.",
    "portfolio": "¿Cómo puedo adaptar mi portafolio para {target}?",
    "skills": "¿Qué habilidades debería priorizar para {target}?",
    "automation": "¿Cómo puedo optimizar este flujo de automatización para {target}?",
    "general": "¿En qué debería enfocarme en mi búsqueda de empleo?",
    "entity": {
      "job": "Resume el encaje y los próximos pasos para {target}.",
      "resume": "Identifica las mejoras más fuertes para {target}.",
      "studio": "Oriéntame sobre cómo acercarme a {target}.",
      "interviewSession": "Revisa las señales y puntos de coaching de {target}.",
      "automationRun": "Explica qué pasó en {target} y qué corregir después."
    }
  },
  "inputPlaceholder": "Pregunta sobre preparación de entrevistas, empleos, currículums...",
  "inputAria": "Mensaje del chat flotante",
  "sendAria": "Enviar mensaje del chat flotante",
  "hideAria": "Ocultar asistente de chat flotante",
  "showAria": "Mostrar asistente de chat flotante",
  "unreadAria": "{count} mensajes del asistente sin leer",
  "voiceSettings": {
    "toggleButton": "Voz",
    "toggleAria": "Alternar configuración de perfil de modelos de voz",
    "saveSuccess": "Perfil de voz guardado",
    "saveErrorFallback": "No se pudo guardar el perfil de voz"
  }
},
} as const;

export default floatingChat;
