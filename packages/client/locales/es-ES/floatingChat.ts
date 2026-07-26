const floatingChat = {
  floatingChat: {
    contextBadge: "Contexto: {context}",

    focusedEntityBadge: "Enfoque: {entity}",


    contextDomain: {
      resume: "Currículum",
      jobSearch: "Empleos",
      interview: "Entrevista",
      portfolio: "Portafolio",
      skills: "Habilidades",
      automation: "Automatización",
    },
    entityTypes: {
      job: "Empleo",
      resume: "Currículum",
      studio: "Estudio",
      interviewSession: "Entrevista",
      automationRun: "Automatización",
    },
    stateChips: {
      resumes: "{count} currículum | {count} currículums",
      jobs: "{count} empleo seguido | {count} empleos seguidos",
      studios: "{count} estudio | {count} estudios",
      sessions: "{count} sesión | {count} sesiones",
      projects: "{count} proyecto | {count} proyectos",
    },

    suggestionsAria: "Sugerencias de prompts contextuales del asistente",
    suggestionAria: "Usar prompt contextual: {prompt}",

    prompts: {
      focusedEntity: "Dame coaching enfocado para {target}.",
      resume: "¿Cómo puedo mejorar este currículum para {target}?",
      jobSearch: "¿Cómo debo abordar este rol en {target}?",
      interview: "Genera preguntas de preparación para entrevista en {target}.",
      portfolio: "¿Cómo puedo adaptar mi portafolio para {target}?",
      skills: "¿Qué habilidades debería priorizar para {target}?",
      automation: "¿Cómo puedo optimizar este flujo de automatización para {target}?",
      general: "¿En qué debería enfocarme en mi búsqueda de empleo?",
      entity: {
        job: "Resume el encaje y los próximos pasos para {target}.",
        resume: "Identifica las mejoras más fuertes para {target}.",
        studio: "Oriéntame sobre cómo acercarme a {target}.",
        interviewSession: "Revisa las señales y puntos de coaching de {target}.",
        automationRun: "Explica qué pasó en {target} y qué corregir después.",
      },
    },
  },
} as const;

export default floatingChat;
