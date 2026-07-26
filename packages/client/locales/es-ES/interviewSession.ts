const interviewSession = {
  interviewSession: {
    title: "Práctica de Entrevista",
    timeLabel: "Tiempo",
    timeAria: "Tiempo transcurrido de entrevista {minutes} minutos y {seconds} segundos",
    progressLabel: "Pregunta {current} de {total}",
    progressAria: "Progreso de entrevista",
    feedbackScore: "Puntuación: {score}%",
    responseTitle: "Tu Respuesta",
    responsePlaceholder: "Escribe tu respuesta aquí...",
    responseAria: "Texto de respuesta de entrevista",
    minResponseHint: "La respuesta debe tener al menos {count} caracteres.",
    endAria: "Finalizar sesión de entrevista",
    endButton: "Finalizar Entrevista",
    submitAria: "Enviar respuesta de entrevista",
    submitNextButton: "Enviar y Siguiente",
    submitFinishButton: "Enviar y Finalizar",
    notFound: "Sesión no encontrada. Inicia una nueva entrevista.",
    voice: {
      listening: "Escuchando...",
      idle: "Entrada de voz",
      startTitle: "Iniciar entrada de voz",
      stopTitle: "Dejar de escuchar",
      startAria: "Iniciar entrada de voz",
      stopAria: "Detener entrada de voz",
      stopButton: "Detener",
    },
    toasts: {
      responseRecorded: "Respuesta registrada",
      completed: "Entrevista completada",
    },
    errors: {
      minResponseLength: "La respuesta debe tener al menos {count} caracteres",
      submitFailed: "Error al enviar respuesta",
      completeFailed: "Error al completar entrevista",
    },
  },
} as const;

export default interviewSession;
