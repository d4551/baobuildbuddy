const catalog = {
  resumeBuildPage: {
    title: "Crea tu CV con IA",
    subtitle:
      "Indica tu rol objetivo y estudio. Generaremos preguntas personalizadas y crearemos tu currículum.",
    seoTitle: "Constructor de CV con IA",
    seoDescription:
      "Genera preguntas de CV específicas por rol, respóndelas paso a paso y sintetiza un currículum listo para editar.",
    progressAria: "Progreso del constructor de currículum",
    generatingLabel: "Generando preguntas personalizadas...",
    synthesizingLabel: "Creando tu currículum...",
    toasts: {
      resumeCreated: "Currículum creado",
    },
    errors: {
      emptyQuestions: "No se generaron preguntas. Inténtalo de nuevo.",
      generateQuestions: "Error al generar preguntas",
      createResume: "Error al crear currículum",
    },
    experienceLevels: {
      any: "Cualquiera",
      entry: "Principiante",
      mid: "Medio",
      lead: "Líder",
    },
    target: {
      title: "Rol y Estudio Objetivo",
      description:
        "¿Qué rol buscas? Opcionalmente selecciona un estudio para personalizar las preguntas.",
      roleLegend: "Rol Objetivo",
      roleLabel: "ej. Diseñador de Juegos en estudio AAA, Programador Junior",
      rolePlaceholder: "ej. Diseñador de Juegos en estudio AAA",
      roleAria: "Rol objetivo",
      studioLegend: "Estudio (opcional)",
      studioLabel: "Elige un estudio para personalizar preguntas",
      studioAria: "Selección de estudio",
      noStudioOption: "Ninguno seleccionado",
      studioNameLabel: "O escribe el nombre del estudio",
      studioNamePlaceholder: "ej. Epic Games",
      studioNameAria: "Nombre personalizado del estudio",
      experienceLegend: "Nivel de Experiencia (opcional)",
      experienceAria: "Nivel de experiencia",
      generateButton: "Generar Preguntas",
      generateAria: "Generar preguntas de CV personalizadas",
    },
    questions: {
      title: "Pregunta {current} de {total}",
      changeTargetButton: "Cambiar objetivo",
      changeTargetAria: "Volver a la selección de objetivo",
      answerPlaceholder: "Tu respuesta para: {question}",
      answerAria: "Respuesta para la pregunta: {question}",
      backButton: "Atrás",
      backAria: "Pregunta anterior",
      nextButton: "Siguiente",
      nextAria: "Siguiente pregunta",
      createResumeButton: "Crear Currículum",
    },
  },
} as const;

export default catalog;
