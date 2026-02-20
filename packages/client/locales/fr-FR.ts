/**
 * French (France) locale overrides layered on top of `en-US`.
 *
 * Maintains a single source of truth in the English catalog and avoids cross-locale drift.
 */
import type { AppTranslationOverrides } from "~/locales/en-US";



const frFROverrides = {
  "meta": {
    "title": "BaoBuildBuddy - Assistant de Carrière IA",
    "description": "Assistant de carrière IA pour l'industrie du jeu vidéo"
  },
  "app": {
    "tagline": "Assistant de Carrière IA pour le Développement de Jeux"
  },
  "common": {
    "relativeTime": {
      "justNow": "à l'instant",
      "minutesAgo": "il y a {count}min",
      "hoursAgo": "il y a {count}h",
      "daysAgo": "il y a {count}j",
      "weeksAgo": "il y a {count}s"
    }
  },
  "a11y": {
    "toggleSidebar": "Basculer la barre latérale",
    "toggleTheme": "Basculer le thème",
    "openSettings": "Ouvrir les paramètres",
    "primaryNavigation": "Navigation principale",
    "mobilePrimaryNavigation": "Navigation principale mobile",
    "toggleSidebarNavigation": "Basculer la navigation latérale",
    "sidebarNavigation": "Navigation latérale",
    "closeSidebar": "Fermer la barre latérale",
    "skipToContent": "Aller au contenu",
    "breadcrumbs": "Fil d'Ariane",
    "notifications": "Notifications",
    "dismissNotification": "Fermer la notification",
    "localeSwitcher": "Changer de langue"
  },
  "confirmDialog": {
    "confirmButton": "Confirmer",
    "cancelButton": "Annuler"
  },
  "errorPage": {
    "title": "{brand} a rencontré une erreur",
    "fallbackMessage": "Une erreur s'est produite.",
    "statusLabel": "Statut",
    "backToDashboardButton": "Retour au tableau de bord",
    "resetButton": "Réinitialiser"
  },
  "nav": {
    "dashboard": "Tableau de bord",
    "jobs": "Emplois",
    "resume": "CV",
    "coverLetter": "Lettre de motivation",
    "portfolio": "Portfolio",
    "interview": "Entretien",
    "skills": "Compétences",
    "studios": "Studios",
    "automation": "Automatisation",
    "gamification": "Gamification",
    "settings": "Paramètres"
  },
  "jobCard": {
    "remoteBadge": "Télétravail",
    "hybridBadge": "Hybride",
    "matchBadge": "{score}% de correspondance",
    "matchBadgeAria": "Score de correspondance {score} pour cent",
    "moreTechnologies": "+{count} de plus"
  },
  "resumePreview": {
    "printButton": "Imprimer",
    "printAria": "Imprimer l'aperçu du CV",
    "notFound": "CV introuvable. Veuillez sélectionner un CV à prévisualiser."
  },
  "portfolioPage": {
    "preview": {
      "backButton": "Retour à l'éditeur",
      "backButtonAria": "Retour à l'éditeur de portfolio",
      "exportPdfButton": "Exporter en PDF",
      "exportPdfAria": "Exporter l'aperçu du portfolio en PDF",
      "defaultTitle": "Mon Portfolio",
      "contactButton": "Me contacter",
      "contactAria": "Contacter le propriétaire du portfolio par e-mail",
      "websiteButton": "Visiter le site",
      "websiteAria": "Ouvrir le site du portfolio",
      "featuredProjectsTitle": "Projets mis en avant",
      "moreProjectsTitle": "Plus de projets",
      "viewButton": "Voir",
      "emptyState": "Aucun projet à afficher. Ajoutez des projets dans l'éditeur de portfolio.",
      "notFound": "Portfolio introuvable. Créez d'abord votre portfolio."
    }
  },
  "interviewScoreCard": {
    "title": "Analyse des performances d'entretien",
    "progressAria": "Score global d'entretien {score} pour cent",
    "overallScore": "Score global",
    "strengths": "Points forts",
    "areasForImprovement": "Axes d'amélioration",
    "recommendations": "Recommandations"
  },
  "dailyChallengeCard": {
    "completedBanner": "Terminé !",
    "completeButton": "Terminer le défi",
    "completedButton": "Terminé",
    "completeAria": "Terminer le défi quotidien {title}"
  },
  "interviewSession": {
    "title": "Entraînement d'entretien",
    "timeLabel": "Temps",
    "timeAria": "Temps d'entretien écoulé : {minutes} minutes et {seconds} secondes",
    "progressLabel": "Question {current} sur {total}",
    "progressAria": "Progression de l'entretien",
    "jobTargetBadge": "Poste ciblé",
    "interviewerLabel": "Intervieweur",
    "feedbackTitle": "Retour",
    "feedbackScore": "Score : {score}%",
    "responseTitle": "Votre réponse",
    "responsePlaceholder": "Saisissez votre réponse ici...",
    "responseAria": "Texte de réponse d'entretien",
    "minResponseHint": "La réponse doit contenir au moins {count} caractères.",
    "endAria": "Terminer la session d'entretien",
    "endButton": "Terminer l'entretien",
    "submitAria": "Envoyer la réponse d'entretien",
    "submitNextButton": "Envoyer et suivant",
    "submitFinishButton": "Envoyer et terminer",
    "notFound": "Session introuvable. Veuillez démarrer un nouvel entretien.",
    "voice": {
      "listening": "Écoute...",
      "idle": "Saisie vocale",
      "startTitle": "Démarrer la saisie vocale",
      "stopTitle": "Arrêter l'écoute",
      "startAria": "Démarrer la saisie vocale",
      "stopAria": "Arrêter la saisie vocale",
      "startButton": "Micro",
      "stopButton": "Arrêter"
    },
    "toasts": {
      "responseRecorded": "Réponse enregistrée",
      "completed": "Entretien terminé"
    },
    "errors": {
      "minResponseLength": "La réponse doit contenir au moins {count} caractères",
      "submitFailed": "Échec de l'envoi de la réponse",
      "completeFailed": "Échec de la finalisation de l'entretien"
    }
  },
  "aiChatCommon": {
    "timeAt": "à {time}",
    "voice": {
      "listeningStatus": "Écoute en cours...",
      "speakingStatus": "Lecture de la réponse...",
      "idleStatus": "Voix prête"
    }
  }
} as const satisfies AppTranslationOverrides;

export default frFROverrides;
