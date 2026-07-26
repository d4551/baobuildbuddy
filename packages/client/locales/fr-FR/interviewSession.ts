const interviewSession = {
  interviewSession: {
    title: "Entraînement d'entretien",
    timeLabel: "Temps",
    timeAria: "Temps d'entretien écoulé : {minutes} minutes et {seconds} secondes",
    progressLabel: "Question {current} sur {total}",
    progressAria: "Progression de l'entretien",
    feedbackTitle: "Retour",
    feedbackScore: "Score : {score}%",
    responseTitle: "Votre réponse",
    responsePlaceholder: "Saisissez votre réponse ici...",
    responseAria: "Texte de réponse d'entretien",
    minResponseHint: "La réponse doit contenir au moins {count} caractères.",
    endAria: "Terminer la session d'entretien",
    endButton: "Terminer l'entretien",
    submitAria: "Envoyer la réponse d'entretien",
    submitNextButton: "Envoyer et suivant",
    submitFinishButton: "Envoyer et terminer",
    notFound: "Session introuvable. Veuillez démarrer un nouvel entretien.",
    voice: {
      listening: "Écoute...",
      idle: "Saisie vocale",
      startTitle: "Démarrer la saisie vocale",
      stopTitle: "Arrêter l'écoute",
      startAria: "Démarrer la saisie vocale",
      stopAria: "Arrêter la saisie vocale",
      startButton: "Micro",
      stopButton: "Arrêter",
    },
    toasts: {
      responseRecorded: "Réponse enregistrée",
      completed: "Entretien terminé",
    },
    errors: {
      minResponseLength: "La réponse doit contenir au moins {count} caractères",
      submitFailed: "Échec de l'envoi de la réponse",
      completeFailed: "Échec de la finalisation de l'entretien",
    },
  },
} as const;

export default interviewSession;
